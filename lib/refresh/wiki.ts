// Minimal Wikipedia API client. Wikipedia requires a descriptive User-Agent and asks bots to use maxlag.
const API = "https://en.wikipedia.org/w/api.php";

function userAgent(): string {
  return process.env.WIKI_USER_AGENT || "ChakDeIndiaTracker/1.0 (hobby project; set WIKI_USER_AGENT in .env.local)";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;

async function call<T>(params: Record<string, string>, attempt = 0): Promise<T> {
  // be polite: one request at a time, at least 700ms apart
  const wait = lastCall + 700 - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const qs = new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...params });
  const res = await fetch(`${API}?${qs}`, { headers: { "User-Agent": userAgent() } });
  if ((res.status === 429 || res.status === 503) && attempt < 4) {
    const retryAfter = Number(res.headers.get("retry-after"));
    await sleep((retryAfter > 0 ? Math.min(retryAfter, 30) : 4 * (attempt + 1)) * 1000);
    return call<T>(params, attempt + 1);
  }
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status} for ${params.page ?? params.titles}`);
  const json = (await res.json()) as T & { error?: { code: string; info: string } };
  if (json.error) {
    // maxlag: servers are busy, wait and retry a couple of times.
    if (json.error.code === "maxlag" && attempt < 3) {
      await sleep(3000 * (attempt + 1));
      return call<T>(params, attempt + 1);
    }
    throw new Error(`Wikipedia API error ${json.error.code}: ${json.error.info}`);
  }
  return json;
}

export async function getWikitext(page: string): Promise<string> {
  const j = await call<{ parse: { wikitext: string } }>({ action: "parse", page, prop: "wikitext", redirects: "1" });
  return j.parse.wikitext;
}

export async function getSections(page: string): Promise<{ line: string; index: string }[]> {
  const j = await call<{ parse: { sections: { line: string; index: string }[] } }>({
    action: "parse", page, prop: "sections", redirects: "1",
  });
  return j.parse.sections;
}

export async function getSectionHtml(page: string, section: string): Promise<string> {
  const j = await call<{ parse: { text: string } }>({ action: "parse", page, prop: "text", section, redirects: "1" });
  return j.parse.text;
}

/** Latest revision id per title; used to skip re-parsing unchanged pages. Missing pages map to 0. */
export async function getRevisionIds(titles: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40);
    const j = await call<{
      query: { pages: { title: string; missing?: boolean; revisions?: { revid: number }[] }[]; redirects?: { from: string; to: string }[]; normalized?: { from: string; to: string }[] };
    }>({ action: "query", prop: "revisions", rvprop: "ids", titles: chunk.join("|"), redirects: "1" });
    const alias = new Map<string, string>();
    for (const n of j.query.normalized ?? []) alias.set(n.from, n.to);
    for (const r of j.query.redirects ?? []) alias.set(alias.get(r.from) ?? r.from, r.to);
    const byTitle = new Map(j.query.pages.map((p) => [p.title, p.missing ? 0 : (p.revisions?.[0]?.revid ?? 0)]));
    for (const t of chunk) {
      const n = alias.get(t) ?? t;
      out[t] = byTitle.get(alias.get(n) ?? n) ?? 0;
    }
  }
  return out;
}
