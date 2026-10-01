import * as cheerio from "cheerio";
import type { Country, MedalEntry, MedalsData } from "../types";
import { medalsSchema } from "../schemas";
import { nocInfo } from "../flags";
import { nowIst, readCache, readDataJson, saveValidated, writeCache } from "./store";
import { getRevisionIds, getSectionHtml, getSections, getWikitext } from "./wiki";

const TABLE_PAGE = "2026_Asian_Games_medal_table";
const INDIA_PAGE = "India_at_the_2026_Asian_Games";
const DETAIL_COUNTRIES = 12; // top N other countries get a per-medal list (best effort)
const GAMES_YEAR = 2026;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "22 September" -> "2026-09-22" (also accepts "September 22"). */
export function parseDay(text: string): string | null {
  const t = text.replace(/\[.*?\]/g, "").trim();
  const m = t.match(/(\d{1,2})\s+([A-Za-z]+)/) ?? t.match(/([A-Za-z]+)\s+(\d{1,2})/);
  if (!m) return null;
  const [d, mon] = /\d/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
  const mi = MONTHS.findIndex((x) => x.toLowerCase().startsWith(mon.toLowerCase().slice(0, 3)));
  if (mi < 0) return null;
  return `${GAMES_YEAR}-${String(mi + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** gold_IND = 10 | silver_IND = 23 | bronze_IND = 33 -> counts by IOC code. */
export function parseMedalTable(wikitext: string): Record<string, { gold: number; silver: number; bronze: number }> {
  const out: Record<string, { gold: number; silver: number; bronze: number }> = {};
  for (const m of wikitext.matchAll(/(gold|silver|bronze)_([A-Z]{3})\s*=\s*(\d+)/g)) {
    const [, kind, code, n] = m;
    (out[code] ??= { gold: 0, silver: 0, bronze: 0 })[kind as "gold" | "silver" | "bronze"] = Number(n);
  }
  return out;
}

const clean = (s: string) => s.replace(/\s+/g, " ").replace(/\[\d+\]/g, "").trim();

/** Parse a "Medalists" table (columns Medal | Athlete | Sport | Event | Date). Returns [] if no matching table. */
export function parseMedalistsHtml(html: string): MedalEntry[] {
  const $ = cheerio.load(html);
  const entries: MedalEntry[] = [];
  $("table.wikitable").each((_, table) => {
    const heads = $(table).find("tr").first().find("th").map((_, th) => clean($(th).text()).toLowerCase()).get();
    const find = (...names: string[]) => heads.findIndex((h) => names.includes(h));
    const cM = find("medal"), cAth = find("athlete", "athletes", "name", "competitor", "competitors");
    const cS = find("sport"), cE = find("event"), cD = find("date");
    if ([cM, cAth, cS, cE, cD].some((c) => c < 0)) return;
    $(table).find("tr").slice(1).each((_, tr) => {
      const tds = $(tr).children("td");
      if (tds.length < 5) return;
      const medalText = clean($(tds[cM]).text()).toLowerCase();
      const type = (["gold", "silver", "bronze"] as const).find((t) => medalText.includes(t));
      const date = parseDay($(tds[cD]).text());
      if (!type || !date) return;
      const cell = $(tds[cAth]);
      let athletes: string[];
      if (cell.find("ul").length) {
        // team entry: team name followed by a list of players -> keep the team name
        const c = cell.clone();
        c.find("style, .div-col, ul").remove();
        const team = clean(c.text());
        // some team rows have no team label, only the player list -> use the players
        athletes = team ? [team] : cell.find("li").map((_, li) => clean($(li).text())).get().filter(Boolean);
      } else {
        const links = cell.find("a").map((_, a) => clean($(a).text())).get().filter(Boolean);
        athletes = links.length ? links : [clean(cell.text())].filter(Boolean);
      }
      if (!athletes.length) return;
      entries.push({
        type,
        sport: clean($(tds[cS]).text()),
        event: clean($(tds[cE]).text()),
        athletes,
        date,
      });
    });
    return false; // first matching table only
  });
  return entries;
}

async function fetchMedalists(page: string): Promise<MedalEntry[]> {
  const sections = await getSections(page);
  const sec = sections.find((s) => /^medal(l)?ists?$/i.test(s.line));
  if (!sec) return [];
  return parseMedalistsHtml(await getSectionHtml(page, sec.index));
}

const medalOrder = (a: { gold: number; silver: number; bronze: number }, b: typeof a) =>
  b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze;

interface State { revs: Record<string, number>; details: Record<string, MedalEntry[]> }

export async function refreshMedals(opts: { force?: boolean } = {}): Promise<MedalsData> {
  const counts = parseMedalTable(await getWikitext(TABLE_PAGE));
  if (!counts.IND) throw new Error("India not found in the medal table; refusing to overwrite data");
  const codes = Object.keys(counts).sort((a, b) => medalOrder(counts[a], counts[b]));

  // Which per-country pages to read: India always, then the top N others by medals.
  const detailCodes = ["IND", ...codes.filter((c) => c !== "IND").slice(0, DETAIL_COUNTRIES)];
  const pageOf = (c: string) => (c === "IND" ? INDIA_PAGE : `${nocInfo(c).page} at the 2026 Asian Games`.replace(/ /g, "_"));
  const revs = await getRevisionIds([TABLE_PAGE, ...detailCodes.map(pageOf)]);

  const prev = await readCache<State>("medals-state.json");
  const details: Record<string, MedalEntry[]> = {};
  const okRevs: Record<string, number> = { [TABLE_PAGE]: revs[TABLE_PAGE] };
  for (const code of detailCodes) {
    const p = pageOf(code);
    const unchanged = !opts.force && prev && prev.revs[p] === revs[p] && prev.details[code];
    if (unchanged) { details[code] = prev.details[code]; okRevs[p] = revs[p]; continue; }
    try {
      details[code] = revs[p] ? await fetchMedalists(p) : [];
      okRevs[p] = revs[p];
    } catch (e) {
      // not recorded in okRevs, so the next run retries this page
      console.warn(`[medals] ${code}: could not read medalists (${(e as Error).message})`);
      details[code] = prev?.details[code] ?? [];
    }
  }
  await writeCache("medals-state.json", { revs: okRevs, details } satisfies State);

  const countries: Country[] = codes.map((code) => {
    const info = nocInfo(code);
    const medals = (details[code] ?? []).sort((a, b) => a.date.localeCompare(b.date));
    const total = counts[code].gold + counts[code].silver + counts[code].bronze;
    if (code === "IND" && medals.length !== total)
      console.warn(`[medals] India: ${medals.length} listed medals vs ${total} in the table (pages edited separately)`);
    return { code, name: info.name, flag: info.flag, ...counts[code], medals };
  });

  const old = await readDataJson<MedalsData>("medals.json");
  const saved = await saveValidated("medals.json", medalsSchema, { lastUpdated: nowIst(), countries });
  console.log(`[medals] saved ${saved.countries.length} countries (was ${old?.countries.length ?? 0}); India ${counts.IND.gold}/${counts.IND.silver}/${counts.IND.bronze}`);
  return saved;
}
