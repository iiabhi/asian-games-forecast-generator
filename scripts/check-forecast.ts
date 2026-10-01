import assert from "node:assert/strict";
import { buildForecastItems, type RemainingEvent } from "../lib/refresh/forecast";

const rem: RemainingEvent[] = [
  { sport: "Hockey", event: "Men's Hockey Final", date: "2026-10-03", india_entries: ["India men's hockey team"], stage: "Final vs Japan" },
  { sport: "Archery", event: "Men's recurve", date: "2026-10-02", india_entries: ["Dhiraj"], stage: "Round of 16" },
  { sport: "Golf", event: "Men's individual", date: "2026-10-01", india_entries: ["X"], stage: "Round 4" },
];
const r = (id: string, likelihood: "high" | "medium" | "long-shot" = "high") => ({ id, likelihood, potentialMedal: "gold" as const, reason: "ok" });
// e4 = hallucinated id, e1 duplicated, e3 already played, e2 "high" outside a final is downgraded
const out = buildForecastItems(rem, [r("e1"), r("e1"), r("e2"), r("e3"), r("e4")], "2026-10-02");
assert.deepEqual(out.map((i) => [i.event, i.likelihood]), [["Men's recurve", "medium"], ["Men's Hockey Final", "high"]]);
assert.deepEqual(out[1].athletes, ["India men's hockey team"]);
console.log("forecast guards OK");
