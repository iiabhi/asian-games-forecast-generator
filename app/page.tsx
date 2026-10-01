import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMedals, getNews } from "@/lib/data";
import { rankCountries } from "@/lib/ranking";
import { GAMES_END, dayOf, daysBetween } from "@/lib/dates";
import { Leaderboard } from "@/components/Leaderboard";

// Read JSON on every request so edits to /data show up without a rebuild.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [medals, news] = await Promise.all([getMedals(), getNews()]);
  const ranked = rankCountries(medals.countries);
  const india = ranked.find((c) => c.code === "IND");
  const today = dayOf(medals.lastUpdated);
  const daysLeft = Math.max(daysBetween(today, GAMES_END), 0);
  const todayMedals = india?.medals.filter((m) => m.date === today).length ?? 0;
  const latest = news.items.filter((n) => n.isIndia).slice(0, 3);

  return (
    <>
      <section className="fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0b0b6b] to-[#14146e] p-7 text-center text-white shadow-[0_20px_50px_rgba(0,0,128,0.35)] sm:p-10">
        <div aria-hidden className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-saffron/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-india-green/40 blur-3xl" />
        <div className="relative">
          <p className="mx-auto inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
            🇮🇳 Aichi-Nagoya 2026 · Cheer for Team India
          </p>
          <h1 className="shimmer mt-4 bg-gradient-to-r from-saffron via-white to-[#5ee04a] bg-clip-text text-4xl font-extrabold text-transparent sm:text-6xl">
            Go for Gold, India!
          </h1>
          <p className="mt-2 text-sm text-white/80">Every medal counts. Jai Hind!</p>
          <div className="mt-6 flex justify-center gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur">
              <div className="font-display text-3xl font-extrabold">{daysLeft}</div>
              <div className="text-xs text-white/75">{daysLeft === 1 ? "day" : "days"} left</div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur">
              <div className="font-display text-3xl font-extrabold text-[#5ee04a]">{todayMedals}</div>
              <div className="text-xs text-white/75">India medals today</div>
            </div>
          </div>
          <Link href="/forecast" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron to-orange-500 px-7 py-3.5 font-display font-bold text-white shadow-[0_10px_30px_rgba(255,153,51,0.5)] transition hover:scale-105">
            🏅 See India&apos;s Medal Forecast
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </section>

      <div className="fade-up [animation-delay:120ms]"><Leaderboard countries={ranked} /></div>

      {latest.length > 0 && (
        <section aria-labelledby="latest-news" className="card fade-up p-5 [animation-delay:200ms]">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="latest-news" className="text-lg font-bold">Latest India news</h2>
            <Link href="/news" className="text-sm font-semibold text-navy hover:underline">All news →</Link>
          </div>
          <ul className="space-y-2 text-sm">
            {latest.map((n) => (
              <li key={n.url}><Link href="/news" className="flex gap-2 hover:text-navy hover:underline"><span className="text-saffron">●</span>{n.title}</Link></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
