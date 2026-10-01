"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { RankedCountry } from "@/lib/types";
import { CountryRow } from "./CountryRow";
import { OPEN_INDIA_EVENT } from "./IndiaTag";

export function Leaderboard({ countries }: { countries: RankedCountry[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (code: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(code)) next.add(code);
      return next;
    });

  const revealIndia = useCallback(() => {
    setQuery("");
    setOpen((prev) => new Set(prev).add("IND"));
    requestAnimationFrame(() => document.getElementById("india")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, []);

  useEffect(() => {
    if (location.hash === "#india") revealIndia();
    window.addEventListener(OPEN_INDIA_EVENT, revealIndia);
    return () => window.removeEventListener(OPEN_INDIA_EVENT, revealIndia);
  }, [revealIndia]);

  const india = countries.find((c) => c.code === "IND");
  const filtered = useMemo(
    () => countries.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [countries, query],
  );

  return (
    <section aria-labelledby="tally-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="tally-heading" className="text-2xl font-extrabold">Medal Tally</h2>
        <label className="relative">
          <span className="sr-only">Search countries</span>
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country"
            className="w-40 rounded-full border border-white bg-white/80 py-2 shadow-sm backdrop-blur pl-8 pr-3 text-sm focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/40 sm:w-56"
          />
        </label>
      </div>

      {india && india.rank > 3 && !query && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy">Team India</p>
          <ul><CountryRow country={india} isIndia pinned open={open.has("IND")} onToggle={() => toggle("IND")} /></ul>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white bg-white/60 shadow-[0_8px_30px_rgba(0,0,128,0.10)] backdrop-blur">
        <div className="hidden grid-cols-[2.5rem_2rem_1fr_3.5rem_3.5rem_3.5rem_3.5rem_1.5rem] gap-x-3 bg-gradient-to-r from-navy to-[#1a1a9c] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white sm:grid">
          <span>Rank</span><span>Flag</span><span>Country</span>
          <span className="text-center">Gold</span><span className="text-center">Silver</span>
          <span className="text-center">Bronze</span><span className="text-center">Total</span><span />
        </div>
        <div className="grid grid-cols-[1.5rem_1.5rem_1fr_3.25rem_2.25rem_1.25rem] gap-x-2 bg-gradient-to-r from-navy to-[#1a1a9c] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white sm:hidden">
          <span>#</span><span /><span>Country</span><span className="text-center">G</span><span className="text-center">Tot</span><span className="w-5" />
        </div>
        <ul className="divide-y divide-slate-100">
          {filtered.map((c) => (
            <CountryRow key={c.code} id={c.code === "IND" ? "india" : undefined} country={c} isIndia={c.code === "IND"}
              open={open.has(c.code)} onToggle={() => toggle(c.code)} />
          ))}
          {filtered.length === 0 && <li className="bg-white p-4 text-center text-slate-500">No country matches “{query}”.</li>}
        </ul>
      </div>
    </section>
  );
}
