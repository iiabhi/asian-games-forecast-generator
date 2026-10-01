import { XMLParser } from "fast-xml-parser";
import type { NewsData, NewsItem } from "../types";
import { newsSchema } from "../schemas";
import { nowIst, readDataJson, saveValidated } from "./store";

// Unofficial, undocumented feed (Google asks for personal, non-commercial use). If it fails we keep the last good file.
const feed = (q: string, hl: string, gl: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl.split("-")[0]}`;
const GAMES = '"Asian Games" (Nagoya OR Aichi)';
// India edition for India stories; US / Japan / Singapore editions (India excluded) for the rest of the Games.
// Without the separate global feeds, India stories crowd out everything else.
const INDIA_FEEDS = [feed(`${GAMES} India when:2d`, "en-IN", "IN")];
const GLOBAL_FEEDS = [
  feed(`${GAMES} -India when:2d`, "en-US", "US"),
  feed(`${GAMES} when:2d`, "en", "JP"),
  feed(`${GAMES} -India when:2d`, "en-SG", "SG"),
];
const MAX_INDIA = 25;
const MAX_OTHER = 25;
const INDIA_RE = /\bIndia(n|ns)?\b/i;

interface RssItem { title?: string; link?: string; pubDate?: string; source?: string | { "#text"?: string } }

async function fetchFeed(url: string): Promise<RssItem[]> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ChakDeIndiaTracker/1.0)" } });
  if (!res.ok) throw new Error(`Google News RSS HTTP ${res.status}`);
  const xml = new XMLParser({ ignoreAttributes: true }).parse(await res.text());
  const items = xml?.rss?.channel?.item;
  return Array.isArray(items) ? items : items ? [items] : [];
}

/** Google appends " - Source Name" to every title; strip it. */
export function stripSource(title: string, source: string): string {
  const t = title.trim();
  if (source && t.endsWith(` - ${source}`)) return t.slice(0, -(source.length + 3)).trim();
  return t.replace(/\s+-\s+[^-]{2,40}$/, "").trim();
}

function toItem(r: RssItem, isIndia: boolean): NewsItem | null {
  if (!r.title || !r.link || !r.pubDate) return null;
  const date = new Date(r.pubDate);
  if (Number.isNaN(+date)) return null;
  const src = typeof r.source === "string" ? r.source : (r.source?.["#text"] ?? "");
  const title = stripSource(String(r.title), src);
  return {
    title,
    source: src || "Google News",
    url: String(r.link),
    imageUrl: null, // Google News RSS has no images
    publishedAt: nowIst(date),
    isIndia: isIndia || INDIA_RE.test(title),
  };
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function collect(urls: string[], isIndia: boolean): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(urls.map(fetchFeed));
  const ok = settled.filter((r): r is PromiseFulfilledResult<RssItem[]> => r.status === "fulfilled");
  if (ok.length === 0) throw new Error(`all ${isIndia ? "India" : "global"} feeds failed`);
  return ok.flatMap((r) => r.value).map((r) => toItem(r, isIndia)).filter((i): i is NewsItem => i !== null);
}

export async function refreshNews(): Promise<NewsData> {
  const [india, global] = await Promise.all([collect(INDIA_FEEDS, true), collect(GLOBAL_FEEDS, false)]);
  const merged = new Map<string, NewsItem>();
  for (const item of [...india, ...global]) {
    const key = norm(item.title);
    const seen = merged.get(key);
    if (seen) seen.isIndia ||= item.isIndia; // same story in several feeds
    else merged.set(key, item);
  }
  const newest = (a: NewsItem, b: NewsItem) => +new Date(b.publishedAt) - +new Date(a.publishedAt);
  const all = [...merged.values()].sort(newest);
  // cap each side separately so the "All" tab always has non-India stories
  const items = [...all.filter((i) => i.isIndia).slice(0, MAX_INDIA), ...all.filter((i) => !i.isIndia).slice(0, MAX_OTHER)].sort(newest);
  if (items.length === 0) throw new Error("no news items parsed; refusing to overwrite data");

  const old = await readDataJson<NewsData>("news.json");
  const saved = await saveValidated("news.json", newsSchema, { items });
  console.log(`[news] saved ${saved.items.length} items (${saved.items.filter((i) => i.isIndia).length} India); was ${old?.items.length ?? 0}`);
  return saved;
}
