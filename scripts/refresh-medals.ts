import { refreshMedals } from "../lib/refresh/medals";

refreshMedals({ force: process.argv.includes("--force") }).catch((e) => {
  console.error("[medals] FAILED, keeping the last good data/medals.json:", e.message);
  process.exit(1);
});
