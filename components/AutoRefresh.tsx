"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-reads the page data while the tab is open, so visitors never need to hit reload.
// router.refresh() keeps client state (open rows, filters, scroll) and only swaps the server-rendered data.
const EVERY_MS = 5 * 60_000;
const MIN_GAP_MS = 60_000;

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < MIN_GAP_MS) return;
      last = Date.now();
      router.refresh();
    };
    const timer = setInterval(refresh, EVERY_MS);
    document.addEventListener("visibilitychange", refresh); // catch up when the tab comes back
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return null;
}
