# Implementation Plan — India @ Asian Games 2026 Medal Tracker

Source: `India @ Asian Games 2026 — Medal Tracker Spec.pdf`. Goal: v1 website on local mock data, supporter-style, India always highlighted.

## 1. Scope
- Routes: `/` (Medal Tally), `/forecast` (India Medal Forecast), `/news` (News). Sticky nav links all three.
- Global header on every page: site name, India tag (flag, rank, G/S/B, total), "Last updated".
- No auth, no DB, no state library, no UI kit (only `lucide-react` if needed).
- Out of scope for v1: real data sources, LLM calls (placeholders only).

## 2. Stack
Next.js (App Router) + TypeScript + Tailwind CSS. Data from `/data/*.json` through `lib/data.ts`. Route handlers under `/app/api`.

## 3. Architecture
| Layer | File | Responsibility |
|---|---|---|
| Types | `lib/types.ts` | `Country`, `MedalEntry`, `Forecast*`, `NewsItem`, `RankedCountry` |
| Data access | `lib/data.ts` | `getMedals()`, `getForecast()`, `getNews()` — read JSON, each with `// TODO: replace with real source` |
| Ranking | `lib/ranking.ts` | Sort gold→silver→bronze, compute total, tied countries share rank (competition ranking 1,2,2,4) |
| Header | `components/IndiaTag.tsx` (client) | Rank/medals from computed data; click scrolls to + expands India row; optional confetti |
| Table | `components/Leaderboard.tsx` (client) | Search filter, pinned India row, multi-open state |
| Row | `components/CountryRow.tsx` | Row + ▼/▲ arrow + medal panel grouped by sport |
| Cards | `ForecastCard.tsx`, `NewsCard.tsx` | Presentational |
| Placeholders | `app/api/refresh/route.ts`, `prompts/forecast.md`, `.env.example` | Collect → LLM → store flow in comments |

Key design decisions
- Total and rank are computed, never stored.
- "Expand India row" across IndiaTag and Leaderboard: shared via a URL hash (`#india`) plus a small `CustomEvent`; no state library.
- Pages are server components reading data; only interactive pieces are client components.
- Dates for "days remaining" and "today" are computed relative to a fixed `Games end = 2026-10-04` and the data file's `lastUpdated` date (so mock data stays deterministic); noted in README.
- Mobile (375px): Silver/Bronze columns hidden under `sm`, shown inside the expand panel; no horizontal scroll.
- Flags are emoji.

## 4. Theme
Tailwind colours: saffron `#FF9933`, green `#138808`, navy `#000080`, gold/silver/bronze `#D4AF37/#C0C0C0/#CD7F32`, grey `#F3F4F6`. India row: saffron→white→green low-opacity gradient, 4px saffron left border, bold, "Our Team" pill. Display font Poppins (next/font/google), body system sans. Subtle motion: count-up on India tag numbers, smooth expand (grid-rows transition), optional confetti (CSS-only).

## 5. Mock data (labelled sample)
- `medals.json`: ~18 countries; India 12/18/25 with ~12 detailed entries; others have a handful of entries. Athlete names are fictional placeholders, `"sample": true` banner in UI.
- `forecast.json`: 8 items, mixed likelihood/dates.
- `news.json`: 10 items (mix of India / non-India), `example.com` URLs.

## 6. Build order (maps to spec)
1. Scaffold project, Tailwind theme.
2. Types, JSON, `data.ts`, `ranking.ts`.
3. Layout + India tag + nav.
4. Leaderboard + India highlight + expandable rows.
5. Hero + Forecast CTA + latest news strip.
6. `/forecast` and `/news`.
7. Polish (mobile, animation, copy).
8. Placeholders + README.

## 7. Verification (Done-when checklist)
- [ ] `npm run build` and `npm run dev` succeed; 3 pages return 200.
- [ ] India row distinct; tag totals = 12/18/25 = 55 and correct rank.
- [ ] Every row expands with medals grouped by sport.
- [ ] Ranking order and ties verified by a unit-style script.
- [ ] Forecast CTA → `/forecast` with cards + disclaimer.
- [ ] News India/All tabs, newest first, links `target="_blank"`.
- [ ] 375px layout, no horizontal overflow.
- [ ] Editing a JSON file changes the site without code edits.
