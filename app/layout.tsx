import type { Metadata } from "next";
import Link from "next/link";
import { Poppins } from "next/font/google";
import "./globals.css";
import { getMedals } from "@/lib/data";
import { rankCountries } from "@/lib/ranking";
import { formatDateTime } from "@/lib/dates";
import { Background } from "@/components/Background";
import { NavLinks } from "@/components/NavLinks";
import { IndiaTag } from "@/components/IndiaTag";

const display = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });

// Placeholder name — easy to change.
const SITE_NAME = "Chak De India — Asian Games 2026";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "Medal tally of the 20th Asian Games (Aichi-Nagoya 2026) through India's eyes.",
};

// Read JSON on every request so edits to /data show up without a rebuild.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const medals = await getMedals();
  const india = rankCountries(medals.countries).find((c) => c.code === "IND");

  return (
    <html lang="en" className={display.variable}>
      <body className="min-h-screen font-sans">
        <Background />
        <header className="sticky top-0 z-30">
          <nav className="bg-navy/90 text-white backdrop-blur-xl">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
              <Link href="/" className="font-display text-sm font-extrabold leading-tight sm:text-lg">
                <span className="gradient-text">Chak De India</span><span className="text-white/70"> — Asian Games 2026</span>
              </Link>
              <NavLinks />
            </div>
          </nav>
          {india && <IndiaTag rank={india.rank} gold={india.gold} silver={india.silver} bronze={india.bronze} total={india.total} />}
        </header>
        <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 pb-10 text-center text-xs text-slate-500">
          <p>Last updated: {formatDateTime(medals.lastUpdated)}</p>
          <p className="mt-1">
            Medal data:{" "}
            <a href="https://en.wikipedia.org/wiki/2026_Asian_Games_medal_table" target="_blank" rel="noopener noreferrer" className="underline">
              Wikipedia
            </a>{" "}
            (CC BY-SA) · Headlines via Google News
          </p>
          <p className="mt-1 font-semibold text-navy">Jai Hind! 🇮🇳</p>
        </footer>
      </body>
    </html>
  );
}
