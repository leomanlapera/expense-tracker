export const DEFAULT_TZ = "Asia/Manila";

export function todayInTimezone(tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

export function monthStart(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

export function monthEndExclusive(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

// Day/month display formatting doesn't need the user's tz — we pass a UTC
// noon of the local calendar date, which round-trips to the correct wall
// date in any zone.
const DAY_FORMATTER = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatDayHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAY_FORMATTER.format(new Date(Date.UTC(y, m - 1, d, 12)));
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMonth(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return MONTH_FORMATTER.format(new Date(Date.UTC(y, m - 1, d, 12)));
}
