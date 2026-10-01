"use client";

import { useState } from "react";
import type { ForecastItem, Likelihood } from "@/lib/types";
import { ForecastCard } from "./ForecastCard";

type L = "all" | Likelihood;
type D = "all" | "today" | "upcoming";

function Pills<T extends string>({ value, set, opts }: { value: T; set: (v: T) => void; opts: [T, string][] }) {
  return (
    <div className="glass inline-flex rounded-full p-1">
      {opts.map(([k, label]) => (
        <button key={k} aria-pressed={value === k} onClick={() => set(k)}
          className={`rounded-full px-3 py-1 text-sm font-semibold ${value === k ? "bg-gradient-to-r from-saffron to-orange-500 text-white shadow" : "text-navy"}`}>{label}</button>
      ))}
    </div>
  );
}

export function ForecastGrid({ items, today }: { items: ForecastItem[]; today: string }) {
  const [likelihood, setLikelihood] = useState<L>("all");
  const [when, setWhen] = useState<D>("all");

  const shown = items.filter(
    (i) =>
      (likelihood === "all" || i.likelihood === likelihood) &&
      (when === "all" || (when === "today" ? i.eventDate === today : i.eventDate > today)),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Pills value={likelihood} set={setLikelihood} opts={[["all", "Any chance"], ["high", "High"], ["medium", "Medium"], ["long-shot", "Long shot"]]} />
        <Pills value={when} set={setWhen} opts={[["all", "All dates"], ["today", "Today"], ["upcoming", "Upcoming"]]} />
      </div>
      {shown.length === 0 ? (
        <p className="card p-6 text-center text-slate-500">No events match these filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{shown.map((i) => <ForecastCard key={i.sport + i.event} item={i} />)}</div>
      )}
    </div>
  );
}
