import { refreshNews } from "../lib/refresh/news";

refreshNews().catch((e) => {
  console.error("[news] FAILED, keeping the last good data/news.json:", e.message);
  process.exit(1);
});
