import { rankCountries } from "../lib/ranking.ts";
import assert from "node:assert/strict";
import medals from "../data/medals.json" with { type: "json" };

const mk = (name: string, gold: number, silver: number, bronze: number) =>
  ({ code: name, name, flag: "", gold, silver, bronze, medals: [] });
const r = rankCountries([mk("A", 1, 0, 0), mk("B", 5, 0, 0), mk("C", 1, 0, 0), mk("D", 1, 5, 0), mk("E", 0, 9, 9)]);
assert.deepEqual(r.map((x) => [x.name, x.rank]), [["B", 1], ["D", 2], ["A", 3], ["C", 3], ["E", 5]]);
const ind = rankCountries(medals.countries as never).find((c) => c.code === "IND")!;
assert.equal(ind.total, ind.gold + ind.silver + ind.bronze);
console.log("ranking OK — India rank", ind.rank);
