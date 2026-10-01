export const GAMES_END = "2026-10-04";

/**
 * The "today" of the site = the calendar day in Japan (JST, UTC+9) of the data file's lastUpdated stamp.
 * Wikipedia and the schedule date events in Japan time, so "today" must follow Japan, not India
 * (JST is 3.5 hours ahead: after 20:30 IST it is already tomorrow in Japan).
 */
export function dayOf(iso: string): string {
  return new Date(+new Date(iso) + 9 * 3600_000).toISOString().slice(0, 10);
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
