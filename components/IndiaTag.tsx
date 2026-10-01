"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MedalDot } from "./MedalDot";

interface Props { rank: number; gold: number; silver: number; bronze: number; total: number }

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1);
      setV(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export const OPEN_INDIA_EVENT = "open-india-row";

export function IndiaTag({ rank, gold, silver, bronze, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [burst, setBurst] = useState(0);
  const g = useCountUp(gold), s = useCountUp(silver), b = useCountUp(bronze), t = useCountUp(total);

  const onClick = () => {
    setBurst((n) => n + 1);
    if (pathname !== "/") {
      router.push("/#india");
    } else {
      history.replaceState(null, "", "#india");
      window.dispatchEvent(new Event(OPEN_INDIA_EVENT));
    }
  };

  return (
    <div className="relative border-b border-white/40 bg-white/75 backdrop-blur-xl shadow-[0_6px_20px_rgba(0,0,128,0.08)]">
      <button
        onClick={onClick}
        aria-label={`India, rank ${rank}. Gold ${gold}, silver ${silver}, bronze ${bronze}, total ${total}. Show India on the leaderboard`}
        className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-sm font-bold text-navy sm:text-base"
      >
        <span className="pulse-glow rounded-full bg-gradient-to-r from-saffron to-orange-500 px-3 py-0.5 text-white">🇮🇳 INDIA · Rank #{rank}</span>
        <span className="flex items-center gap-1"><MedalDot type="gold" label={false} />{g}</span>
        <span className="flex items-center gap-1"><MedalDot type="silver" label={false} />{s}</span>
        <span className="flex items-center gap-1"><MedalDot type="bronze" label={false} />{b}</span>
        <span className="text-india-green">Total {t}</span>
      </button>
      {burst > 0 && (
        <div key={burst} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
          {Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const d = 50 + (i % 3) * 25;
            return (
              <span
                key={i}
                className="absolute h-2 w-2 animate-confetti rounded-sm"
                style={{
                  background: ["#FF9933", "#138808", "#000080", "#D4AF37"][i % 4],
                  ["--dx" as string]: `${Math.cos(a) * d}px`,
                  ["--dy" as string]: `${Math.sin(a) * d}px`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
