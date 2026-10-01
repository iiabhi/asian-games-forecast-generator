import type { Country, RankedCountry } from "./types";

/** Sort by gold, then silver, then bronze; tied countries share a rank (1, 2, 2, 4). */
export function rankCountries(countries: Country[]): RankedCountry[] {
  const sorted = [...countries]
    .map((c) => ({ ...c, total: c.gold + c.silver + c.bronze }))
    .sort(
      (a, b) =>
        b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.name.localeCompare(b.name),
    );
  let prev: RankedCountry | undefined;
  return sorted.map((c, i) => {
    const tied = prev && prev.gold === c.gold && prev.silver === c.silver && prev.bronze === c.bronze;
    const ranked: RankedCountry = { ...c, rank: tied ? prev!.rank : i + 1 };
    prev = ranked;
    return ranked;
  });
}
