import { ChevronDown } from "lucide-react";
import type { MedalEntry, RankedCountry } from "@/lib/types";
import { formatDay } from "@/lib/dates";
import { MedalDot } from "./MedalDot";

function MedalPanel({ country }: { country: RankedCountry }) {
  const bySport = new Map<string, MedalEntry[]>();
  for (const m of country.medals) bySport.set(m.sport, [...(bySport.get(m.sport) ?? []), m]);
  const shown = country.medals.length;

  return (
    <div className="space-y-3 px-4 py-3 text-sm">
      <p className="flex gap-4 font-semibold sm:hidden">
        <span className="flex items-center gap-1"><MedalDot type="silver" />{country.silver} silver</span>
        <span className="flex items-center gap-1"><MedalDot type="bronze" />{country.bronze} bronze</span>
      </p>
      {shown === 0 && <p className="text-slate-500">No event details available yet.</p>}
      {[...bySport.entries()].map(([sport, entries]) => (
        <div key={sport}>
          <h4 className="font-display text-xs font-bold uppercase tracking-wide text-navy">{sport}</h4>
          <ul className="mt-1 space-y-1">
            {entries.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1"><MedalDot type={m.type} /></span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{m.event}</span>
                  <span className="text-slate-600"> — {m.athletes.join(", ")}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-500">{formatDay(m.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {shown > 0 && shown < country.total && (
        <p className="text-xs text-slate-500">Showing {shown} of {country.total} medals.</p>
      )}
    </div>
  );
}

interface Props { country: RankedCountry; isIndia: boolean; open: boolean; onToggle: () => void; id?: string; pinned?: boolean }

export function CountryRow({ country, isIndia, open, onToggle, id, pinned }: Props) {
  const panelId = `panel-${country.code}${pinned ? "-pinned" : ""}`;
  return (
    <li id={id} className={`scroll-mt-28 transition-colors ${isIndia ? "india-row font-bold" : "bg-white/90 hover:bg-white"} ${pinned ? "rounded-2xl" : ""}`}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="grid w-full grid-cols-[1.5rem_1.5rem_1fr_3.25rem_2.25rem_1.25rem] items-center gap-x-2 px-3 py-3 text-left sm:grid-cols-[2.5rem_2rem_1fr_3.5rem_3.5rem_3.5rem_3.5rem_1.5rem] sm:gap-x-3"
      >
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
          country.rank === 1 ? "bg-gold text-white" : country.rank === 2 ? "bg-silver text-white" : country.rank === 3 ? "bg-bronze text-white" : "text-slate-500"}`}>{country.rank}</span>
        <span className="text-2xl leading-none" aria-hidden>{country.flag}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{country.name}</span>
          {isIndia && <span className="shrink-0 whitespace-nowrap rounded-full bg-india-green px-2 py-0.5 text-[10px] font-bold text-white">🇮🇳 Our Team</span>}
        </span>
        <span className="whitespace-nowrap text-center tabular-nums"><span className="text-gold">●</span> {country.gold}</span>
        <span className="hidden text-center tabular-nums sm:block"><span className="text-silver">●</span> {country.silver}</span>
        <span className="hidden text-center tabular-nums sm:block"><span className="text-bronze">●</span> {country.bronze}</span>
        <span className="text-center font-bold tabular-nums">{country.total}</span>
        <ChevronDown className={`h-5 w-5 text-navy transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id={panelId} className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden"><div className="border-t border-black/5 bg-white/70 font-normal">{open && <MedalPanel country={country} />}</div></div>
      </div>
    </li>
  );
}
