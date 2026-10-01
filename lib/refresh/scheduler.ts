import type { MedalsData } from "../types";
import { refreshMedals } from "./medals";
import { refreshNews } from "./news";
import { readDataJson, todayJst } from "./store";

// In-process auto refresh: while the server runs, pull medals (Wikipedia) and news (Google News)
// every AUTO_REFRESH_MINUTES (default 20; set 0 to turn off). Stops after the Games (+1 day grace).
const DEFAULT_MINUTES = 20;
const STOP_AFTER = "2026-10-05";

const g = globalThis as unknown as { __autoRefresh?: { timer: NodeJS.Timeout; running: boolean } };

async function tick() {
  const state = g.__autoRefresh;
  if (!state || state.running) return; // never overlap runs
  if (todayJst() > STOP_AFTER) {
    clearInterval(state.timer);
    console.log("[auto-refresh] Games are over, stopping");
    return;
  }
  state.running = true;
  try {
    for (const [name, fn] of [["medals", refreshMedals], ["news", refreshNews]] as const) {
      try {
        await fn();
      } catch (e) {
        console.error(`[auto-refresh] ${name} failed, keeping last good data:`, (e as Error).message);
      }
    }
  } finally {
    state.running = false;
  }
}

export function startAutoRefresh() {
  // On Vercel there is no long-running server: refreshing is done by cron calling /api/refresh instead.
  if (process.env.VERCEL) return;
  if (g.__autoRefresh) return; // dev hot reload: start only once
  const minutes = Number(process.env.AUTO_REFRESH_MINUTES ?? DEFAULT_MINUTES);
  if (!(minutes > 0)) {
    console.log("[auto-refresh] disabled (AUTO_REFRESH_MINUTES=0)");
    return;
  }
  const ms = minutes * 60_000;
  g.__autoRefresh = { timer: setInterval(tick, ms), running: false };
  g.__autoRefresh.timer.unref?.();
  console.log(`[auto-refresh] every ${minutes} min`);

  // Catch up at startup if the data is already older than the interval.
  readDataJson<MedalsData>("medals.json").then((d) => {
    const age = d ? Date.now() - +new Date(d.lastUpdated) : Infinity;
    if (age > ms) setTimeout(tick, 5000);
  });
}
