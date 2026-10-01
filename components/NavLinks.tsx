"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [["/", "Tally"], ["/forecast", "Forecast"], ["/news", "News"]] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 rounded-full bg-white/10 p-1 text-sm font-semibold">
      {LINKS.map(([href, label]) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1 transition ${active ? "bg-saffron text-white shadow" : "text-white/80 hover:bg-white/15 hover:text-white"}`}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
