import type { MedalType } from "@/lib/types";

const COLORS: Record<MedalType, string> = { gold: "bg-gold", silver: "bg-silver", bronze: "bg-bronze" };

export function MedalDot({ type, label = true }: { type: MedalType; label?: boolean }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ? `${type} medal` : undefined}
      className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10 ${COLORS[type]}`}
    />
  );
}
