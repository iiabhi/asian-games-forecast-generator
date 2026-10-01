import { promises as fs } from "fs";
import path from "path";
import type { ForecastData, ForecastItem, Likelihood, MedalType, MedalsData, NewsData } from "../types";
import { forecastSchema, remainingSchema } from "../schemas";
import { nowIst, readDataJson, saveValidated, todayIst } from "./store";
import { z } from "zod";

export type RemainingEvent = z.infer<typeof remainingSchema>[number];

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

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
    // "high" is only allowed in a final / medal match
    if (likelihood === "high" && !/final|medal match|bronze|gold|semi/i.test(ev.stage ?? "")) likelihood = "medium";
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
  const today = todayIst();
  const raw = await readDataJson<unknown>("india-remaining.json");
  const remaining = remainingSchema.parse(raw ?? []).filter((e) => e.date >= today);
  if (remaining.length === 0) {
    console.log("[forecast] data/india-remaining.json has no upcoming events; keeping the existing forecast.json");
    return null;
  }
  const prompt = await buildPrompt(remaining, today);
  if (opts.dryRun) {
    console.log(prompt);
    return null;
  }
  const items = buildForecastItems(remaining, await callGemini(prompt), today);
  if (items.length === 0) throw new Error("LLM returned no usable items; keeping the existing forecast.json");
  const saved = await saveValidated("forecast.json", forecastSchema, { generatedAt: nowIst(), source: "llm", items });
  console.log(`[forecast] saved ${saved.items.length} items from ${remaining.length} remaining events`);
  return saved;
}
