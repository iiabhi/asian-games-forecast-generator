import { getForecast, getMedals } from "@/lib/data";
import { dayOf, formatDateTime } from "@/lib/dates";
import { ForecastGrid } from "@/components/ForecastGrid";

export const metadata = { title: "India Medal Forecast" };

// Read JSON on every request so edits to /data show up without a rebuild.
export const dynamic = "force-dynamic";

export default async function ForecastPage() {
  const [forecast, medals] = await Promise.all([getForecast(), getMedals()]);
  const upTo = forecast.items.length;

  return (
    <>
      <section>
        <h1 className="text-3xl font-extrabold sm:text-4xl">India Medal Forecast</h1>
        <p className="mt-1 font-semibold text-india-green">India could add up to {upTo} more medals — Jai Hind!</p>
        <p className="mt-2 glass rounded-2xl border-saffron/40 p-3 text-sm">
          AI-generated forecast for fun, not official predictions. Generated {formatDateTime(forecast.generatedAt)}
          {forecast.source === "mock" && " (sample data)"}.
        </p>
      </section>
      <ForecastGrid items={forecast.items} today={dayOf(medals.lastUpdated)} />
    </>
  );
}
