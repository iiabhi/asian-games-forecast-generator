import { promises as fs } from "fs";
import path from "path";
import type { ForecastData, ForecastItem, Likelihood, MedalType, MedalsData, NewsData } from "../types";
import { forecastSchema, remainingSchema } from "../schemas";
import { nowIst, readDataJson, saveValidated, todayJst } from "./store";
import { z } from "zod";

export type RemainingEvent = z.infer<typeof remainingSchema>[number];

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

/** What we ask the LLM to return per event: only judgement fields, never athletes/dates. */
const llmItemSchema = z.object({
  id: z.string(),
  likelihood: z.enum(["high", "medium", "long-shot"]),
  potentialMedal: z.enum(["gold", "silver", "bronze"]),
  reason: z.string().min(1),
});
const llmResponseSchema = z.object({ items: z.array(llmItemSchema) });
type LlmItem = z.infer<typeof llmItemSchema>;

// Gemini structured-output schema (OpenAPI subset)
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          likelihood: { type: "STRING", enum: ["high", "medium", "long-shot"] },
          potentialMedal: { type: "STRING", enum: ["gold", "silver", "bronze"] },
          reason: { type: "STRING" },
        },
        required: ["id", "likelihood", "potentialMedal", "reason"],
      },
    },
  },
  required: ["items"],
};

/** A medal is certain: the entry is in a final or a gold/bronze medal match (not a quarter-final, 1/8 round or semi-final). */
export function medalGuaranteed(ev: RemainingEvent): boolean {
  return /guaranteed/i.test(ev.medal_at_stake ?? "") || /^\s*(final|gold medal|bronze medal)/i.test(ev.stage ?? "");
}

export const idOf = (i: number) => `e${i + 1}`;

/**
 * Turn the LLM's judgements into forecast items. Everything factual (sport, event, athletes, date) comes
 * from india-remaining.json via the id, so the model cannot invent events or athletes. Code enforces the rules.
 */
export function buildForecastItems(remaining: RemainingEvent[], llm: LlmItem[], today: string): ForecastItem[] {
  const seen = new Set<string>();
  const out: ForecastItem[] = [];
  for (const it of llm) {
    const idx = remaining.findIndex((_, i) => idOf(i) === it.id);
    if (idx < 0 || seen.has(it.id)) continue; // hallucinated or duplicate id
    seen.add(it.id);
    const ev = remaining[idx];
    if (ev.date < today) continue; // already played
    let likelihood: Likelihood = it.likelihood;
    // "high" is only allowed when a medal is already guaranteed (a final / gold medal match)
    if (likelihood === "high" && !medalGuaranteed(ev)) likelihood = "medium";
    out.push({
      sport: ev.sport,
      event: ev.event,
      athletes: ev.india_entries,
      eventDate: ev.date,
      likelihood,
      potentialMedal: it.potentialMedal as MedalType,
      reason: it.reason.trim(),
    });
  }
  return out.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

async function callGemini(prompt: string): Promise<LlmItem[]> {
  const key = process.env.LLM_API_KEY;
  if (!key) throw new Error("LLM_API_KEY is not set (add it to .env.local)");
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA },
  });
  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body });
    if (res.ok) {
      const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      return llmResponseSchema.parse(JSON.parse(text)).items;
    }
    lastErr = `Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
    if (res.status !== 429 && res.status < 500) break; // not retryable
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1))); // free tier is rate limited
  }
  throw new Error(lastErr);
}

/** Events that already have a result: no LLM needed, they are shown as finished. */
export function buildDoneItems(done: RemainingEvent[]): ForecastItem[] {
  return done.map((ev) => {
    const r = ev.result!;
    const won = r.medal !== "none";
    return {
      sport: ev.sport,
      event: ev.event,
      athletes: ev.india_entries,
      eventDate: ev.date,
      likelihood: won ? "high" : "long-shot", // unused by the UI for finished events
      potentialMedal: won ? r.medal : "bronze",
      reason: r.note?.trim() || (won ? `Won ${r.medal}.` : "Finished without a medal."),
      result: r,
    } as ForecastItem;
  });
}

export async function buildPrompt(remaining: RemainingEvent[], today: string): Promise<string> {
  const template = await fs.readFile(path.join(process.cwd(), "prompts", "forecast.md"), "utf-8");
  const medals = await readDataJson<MedalsData>("medals.json");
  const news = await readDataJson<NewsData>("news.json");
  const india = medals?.countries.find((c) => c.code === "IND");
  const cutoff = Date.now() - 48 * 3600_000;
  const context = {
    today,
    remaining_events: remaining.map((e, i) => ({ id: idOf(i), ...e })),
    india_medals_so_far: india ? { gold: india.gold, silver: india.silver, bronze: india.bronze } : null,
    recent_india_headlines: (news?.items ?? []).filter((n) => n.isIndia && +new Date(n.publishedAt) >= cutoff).slice(0, 20).map((n) => n.title),
  };
  return `${template}\n\n## Data\n\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`\n`;
}

export async function refreshForecast(opts: { dryRun?: boolean } = {}): Promise<ForecastData | null> {
  const today = todayJst();
  const raw = await readDataJson<unknown>("india-remaining.json");
  const all = remainingSchema.parse(raw ?? []);
  const done = all.filter((e) => e.result);
  // only events still to be played go to the LLM; stale ones (past date, no result) are dropped
  const pending = all.filter((e) => !e.result && e.date >= today);
  if (pending.length === 0 && done.length === 0) {
    console.log("[forecast] data/india-remaining.json has no upcoming or finished events; keeping the existing forecast.json");
    return null;
  }
  const prompt = pending.length ? await buildPrompt(pending, today) : "";
  if (opts.dryRun) {
    console.log(prompt || "(no pending events: nothing would be sent to the LLM)");
    return null;
  }
  const upcoming = pending.length ? buildForecastItems(pending, await callGemini(prompt), today) : [];
  if (pending.length && upcoming.length === 0) throw new Error("LLM returned no usable items; keeping the existing forecast.json");
  const items = [...upcoming, ...buildDoneItems(done)].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const saved = await saveValidated("forecast.json", forecastSchema, {
    generatedAt: nowIst(),
    source: pending.length ? "llm" : "schedule",
    items,
  });
  console.log(`[forecast] saved ${saved.items.length} items (${upcoming.length} forecast by LLM, ${done.length} finished)`);
  return saved;
}
