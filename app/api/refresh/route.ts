import { timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";
import { refreshMedals } from "@/lib/refresh/medals";
import { refreshNews } from "@/lib/refresh/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Wikipedia calls are throttled, so a cold run can take a while

// Refreshes medals (Wikipedia) and news (Google News RSS), validates, and stores them
// (Vercel Blob on Vercel, /data locally). A failure never overwrites the last good data.
//   GET/POST /api/refresh                 -> medals + news
//   GET/POST /api/refresh?only=medals     -> just one of "medals" | "news"
// Auth: `Authorization: Bearer <token>` where token is REFRESH_TOKEN (external cron) or CRON_SECRET (Vercel Cron).
// The forecast is NOT refreshed here (it uses the LLM quota): run `npm run refresh:forecast`.

function authorized(req: Request): boolean {
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  return [process.env.REFRESH_TOKEN, process.env.CRON_SECRET].some((t) => {
    if (!t) return false;
    const a = Buffer.from(given), b = Buffer.from(t);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

async function run(req: Request) {
  if (!process.env.REFRESH_TOKEN && !process.env.CRON_SECRET)
    return Response.json({ ok: false, error: "REFRESH_TOKEN / CRON_SECRET is not configured" }, { status: 503 });
  if (!authorized(req)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const only = new URL(req.url).searchParams.get("only");
  const jobs = ([["medals", refreshMedals], ["news", refreshNews]] as const).filter(([name]) => !only || name === only);
  if (jobs.length === 0) return Response.json({ ok: false, error: "only must be medals or news" }, { status: 400 });

  const results: Record<string, string> = {};
  for (const [name, fn] of jobs) {
    try {
      await fn();
      results[name] = "ok";
    } catch (e) {
      results[name] = `failed (kept last good data): ${(e as Error).message}`;
    }
  }
  revalidateTag("data"); // show the new data immediately instead of after the 60s cache
  const ok = Object.values(results).every((r) => r === "ok");
  return Response.json({ ok, results }, { status: ok ? 200 : 207 });
}

export const GET = run;
export const POST = run;
