# India @ Asian Games 2026 — Medal Tracker (v1)

Supporter-style medal tracker for the 20th Asian Games (Aichi-Nagoya, 19 Sep – 4 Oct 2026). Next.js (App Router) + TypeScript + Tailwind. v1 runs entirely on **sample data** in `/data`.

## Run
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run test:ranking   # checks sort order + ties
```

## Pages
`/` Medal Tally · `/forecast` India Medal Forecast · `/news` News

## Real data

| Data | Source | Command | Output |
|---|---|---|---|
| Medal table + India's medalists (+ best-effort top countries) | Wikipedia API | `npm run refresh:medals` | `data/medals.json` |
| News | Google News RSS (unofficial, personal use) | `npm run refresh:news` | `data/news.json` |
| Medals + news together | — | `npm run refresh` | both |
| Forecast | Gemini (free key) fed by `data/india-remaining.json` | `npm run refresh:forecast` (`-- --dry` prints the prompt) | `data/forecast.json` |

Setup: copy `.env.example` to `.env.local` and fill `WIKI_USER_AGENT` (with a contact), `LLM_API_KEY` (Gemini) and `REFRESH_TOKEN`.

How it stays safe: every result is validated with zod (`lib/schemas.ts`) and written atomically (temp file + rename). If a fetch or LLM call fails, the previous JSON stays in place and the site keeps working. Unchanged Wikipedia pages are skipped via revision ids (`.cache/`).

Auto refresh locally: while `npm run dev` / `npm start` runs, the server refreshes medals and news itself every `AUTO_REFRESH_MINUTES` (default 20, `0` = off) and stops after the Games (`instrumentation.ts`). Not active on Vercel.

## Deploy on Vercel

Vercel's filesystem is read-only and it can't keep a timer running, so on Vercel the data lives in **Vercel Blob** and a **cron** calls `/api/refresh`.

1. Push the repo and import it in Vercel.
2. Project → Storage → create a **Blob** store and connect it (this adds `BLOB_READ_WRITE_TOKEN`).
3. Project → Settings → Environment Variables: `WIKI_USER_AGENT` (with your contact), `REFRESH_TOKEN` (any long random string), `CRON_SECRET` (another random string), `LLM_API_KEY`.
4. Deploy. The first deploy shows the committed `/data` JSON until the first refresh writes to Blob.
5. Schedule the refresh:
   - `vercel.json` has a **daily** cron (the only frequency the free Hobby plan allows) as a safety net.
   - For every 15–20 minutes, add a free external cron (e.g. cron-job.org, or a GitHub Actions schedule): `GET https://<your-site>/api/refresh` with header `Authorization: Bearer <REFRESH_TOKEN>`. Use `?only=medals` / `?only=news` to split the work. Vercel Pro can instead use a `*/20 * * * *` schedule in `vercel.json`.
6. Forecast (manual): `vercel env pull .env.local`, update `data/india-remaining.json`, then `npm run refresh:forecast`. It writes to the same Blob store, so the live site updates within about a minute.

Pages read through `lib/data.ts`: Blob first, committed `/data` as fallback, cached 60s and invalidated right after each refresh.

Notes
- Wikipedia only lists medalists for India (complete) and some other countries. Others show "Showing N of M" or no list.
- Forecast: put India's remaining events in `data/india-remaining.json` (`[{sport, event, date, india_entries[], stage}]`). The LLM only judges likelihood per event id; events, athletes and dates always come from that file, and code drops past events and downgrades "high" outside finals.
- `/api/refresh` (needs `Authorization: Bearer $REFRESH_TOKEN`) refreshes medals + news. It writes into `/data`, so it only works where the filesystem is writable (not on serverless hosts).
- Credit: medal data from Wikipedia (CC BY-SA), shown in the footer.

## Tests
`npm test` (ranking + forecast guard checks).

## Other notes
- "Today" and "days left" are derived from `lastUpdated` in `medals.json` (Games end 2026-10-04, see `lib/dates.ts`).
