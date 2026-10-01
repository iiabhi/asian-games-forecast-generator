import { XMLParser } from "fast-xml-parser";
import type { NewsData, NewsItem } from "../types";
import { newsSchema } from "../schemas";
import { nowIst, readDataJson, saveValidated } from "./store";

// Unofficial, undocumented feed (Google asks for personal, non-commercial use). If it fails we keep the last good file.
const feed = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
const FEEDS = {
  india: feed('"Asian Games" India when:2d'),
  all: feed('"Asian Games" Nagoya when:2d'),
};
const MAX_ITEMS = 30;
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

export async function refreshNews(): Promise<NewsData> {
  const [india, all] = await Promise.all([fetchFeed(FEEDS.india), fetchFeed(FEEDS.all)]);
  const merged = new Map<string, NewsItem>();
  for (const [rows, flag] of [[india, true], [all, false]] as const) {
    for (const r of rows) {
      const item = toItem(r, flag);
      if (!item) continue;
      const key = norm(item.title);
      const seen = merged.get(key);
      if (seen) seen.isIndia ||= item.isIndia; // same story in both feeds
      else merged.set(key, item);
    }
  }
  const items = [...merged.values()]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, MAX_ITEMS);
  if (items.length === 0) throw new Error("no news items parsed; refusing to overwrite data");

  const old = await readDataJson<NewsData>("news.json");
  const saved = await saveValidated("news.json", newsSchema, { items });
  console.log(`[news] saved ${saved.items.length} items (${saved.items.filter((i) => i.isIndia).length} India); was ${old?.items.length ?? 0}`);
  return saved;
}
