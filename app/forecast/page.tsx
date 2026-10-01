import { getForecast, getMedals } from "@/lib/data";
import { dayOf, formatDateTime } from "@/lib/dates";
import { ForecastGrid } from "@/components/ForecastGrid";

export const metadata = { title: "India Medal Forecast" };

// Read JSON on every request so edits to /data show up without a rebuild.
export const dynamic = "force-dynamic";

export default async function ForecastPage() {
  const [forecast, medals] = await Promise.all([getForecast(), getMedals()]);
  const pending = forecast.items.filter((i) => !i.result);
  const won = forecast.items.filter((i) => i.result && i.result.medal !== "none").length;
  // "high" is only ever assigned when a medal is already guaranteed (see medalGuaranteed in lib/refresh/forecast.ts)
  const locked = pending.filter((i) => i.likelihood === "high").length;
  const possible = pending.length;

  return (
    <>
      <section>
        <h1 className="text-3xl font-extrabold sm:text-4xl">India Medal Forecast</h1>
        <p className="mt-1 font-semibold text-india-green">
          {won > 0 && <>{won} won from these events · </>}
          {locked > 0 && <>{locked} medal{locked === 1 ? "" : "s"} already locked in · </>}
          {possible > 0 ? <>India could add up to {possible} more</> : <>All events decided</>} — Jai Hind!
        </p>
        <p className="mt-2 glass rounded-2xl border-saffron/40 p-3 text-sm">
          AI-generated forecast for fun, not official predictions. Generated {formatDateTime(forecast.generatedAt)}
          {forecast.source === "mock" && " (sample data)"}.
        </p>
      </section>
      <ForecastGrid items={forecast.items} today={dayOf(medals.lastUpdated)} />
    </>
  );
}
