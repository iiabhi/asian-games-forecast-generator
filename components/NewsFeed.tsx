"use client";

import { useState } from "react";
import type { NewsItem } from "@/lib/types";
import { NewsCard } from "./NewsCard";

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const [tab, setTab] = useState<"india" | "all">("india");
  const shown = tab === "india" ? items.filter((n) => n.isIndia) : items;
  const tabs = [["india", "India"], ["all", "All Asian Games"]] as const;
  return (
    <div className="space-y-4">
      <div role="tablist" className="inline-flex glass rounded-full p-1">
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-gradient-to-r from-saffron to-orange-500 text-white shadow" : "text-navy"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3">{shown.map((n) => <NewsCard key={n.url} item={n} />)}</div>
    </div>
  );
}
