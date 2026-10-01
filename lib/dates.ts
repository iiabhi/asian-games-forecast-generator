export const GAMES_END = "2026-10-04";

/** The "today" of the site = the date in the data file's lastUpdated stamp (keeps mock data deterministic). */
export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  }) + " IST";
}

export function formatDay(day: string): string {
  return new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}
