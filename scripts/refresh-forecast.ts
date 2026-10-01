import { refreshForecast } from "../lib/refresh/forecast";

// Usage: npm run refresh:forecast [-- --dry]   (--dry prints the prompt without calling the LLM)
refreshForecast({ dryRun: process.argv.includes("--dry") }).catch((e) => {
  console.error("[forecast] FAILED, keeping the last good data/forecast.json:", e.message);
  process.exit(1);
});
