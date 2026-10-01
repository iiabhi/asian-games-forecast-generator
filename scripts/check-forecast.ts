import assert from "node:assert/strict";
import { buildDoneItems, buildForecastItems, type RemainingEvent } from "../lib/refresh/forecast";

const rem: RemainingEvent[] = [
  { sport: "Hockey", event: "Men's Hockey Final", date: "2026-10-03", india_entries: ["India men's hockey team"], stage: "Final vs Japan" },
  { sport: "Archery", event: "Men's recurve", date: "2026-10-02", india_entries: ["Dhiraj"], stage: "1/8 Final vs X", medal_at_stake: "Early round" },
  { sport: "Golf", event: "Men's individual", date: "2026-10-01", india_entries: ["X"], stage: "Round 4" },
];
const r = (id: string, likelihood: "high" | "medium" | "long-shot" = "high") => ({ id, likelihood, potentialMedal: "gold" as const, reason: "ok" });
// e4 = hallucinated id, e1 duplicated, e3 already played, e2 "high" outside a final is downgraded
const out = buildForecastItems(rem, [r("e1"), r("e1"), r("e2"), r("e3"), r("e4")], "2026-10-02");
assert.deepEqual(out.map((i) => [i.event, i.likelihood]), [["Men's recurve", "medium"], ["Men's Hockey Final", "high"]]);
assert.deepEqual(out[1].athletes, ["India men's hockey team"]);
console.log("forecast guards OK");

// finished events: no LLM, result carried through
const done = buildDoneItems([
  { sport: "Boxing", event: "Women's 75kg", date: "2026-10-02", india_entries: ["Lovlina"], result: { medal: "silver", note: "Lost the final 2-3." } },
  { sport: "Archery", event: "Men's Individual", date: "2026-10-02", india_entries: ["Dhiraj"], result: { medal: "none" } },
]);
assert.equal(done[0].result?.medal, "silver");
assert.equal(done[0].reason, "Lost the final 2-3.");
assert.equal(done[1].reason, "Finished without a medal.");
assert.deepEqual(done.map((d) => d.athletes), [["Lovlina"], ["Dhiraj"]]);
console.log("finished-event handling OK");

// "today" follows Japan time: 20:30 IST on 2 Oct is already 3 Oct in Japan
import { dayOf } from "../lib/dates";
assert.equal(dayOf("2026-10-02T20:29:00+05:30"), "2026-10-02");
assert.equal(dayOf("2026-10-02T20:31:00+05:30"), "2026-10-03");
assert.equal(dayOf("2026-10-02T03:51:59+05:30"), "2026-10-02");
console.log("JST day OK");
