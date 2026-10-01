import type { ForecastItem, Likelihood } from "@/lib/types";
import { formatDay } from "@/lib/dates";
import { MedalDot } from "./MedalDot";

const LABEL: Record<Likelihood, { text: string; cls: string }> = {
  high: { text: "High", cls: "bg-india-green text-white" },
  medium: { text: "Medium", cls: "bg-saffron text-white" },
  "long-shot": { text: "Long shot", cls: "bg-slate-200 text-slate-700" },
};

export function ForecastCard({ item }: { item: ForecastItem }) {
  const l = LABEL[item.likelihood];
  return (
    <article className="card relative flex flex-col gap-2 overflow-hidden p-4">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-saffron via-white to-india-green" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.sport}</p>
          <h3 className="font-bold leading-tight">{item.event}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${l.cls}`}>{l.text}</span>
      </div>
      <p className="text-sm">{item.athletes.join(", ")}</p>
      <p className="flex items-center gap-2 text-xs text-slate-600">
        <span>📅 {formatDay(item.eventDate)}</span>
        <span className="flex items-center gap-1">· Could be <MedalDot type={item.potentialMedal} /> {item.potentialMedal}</span>
      </p>
      <p className="text-sm text-slate-700">{item.reason}</p>
    </article>
  );
}
