import { refreshMedals } from "../lib/refresh/medals";
import { refreshNews } from "../lib/refresh/news";

// Medals and news are independent: one failing must not stop the other.
(async () => {
  let failed = false;
  for (const [name, fn] of [["medals", refreshMedals], ["news", refreshNews]] as const) {
    try { await fn(); } catch (e) { failed = true; console.error(`[${name}] FAILED, keeping last good data:`, (e as Error).message); }
  }
  process.exit(failed ? 1 : 0);
})();
