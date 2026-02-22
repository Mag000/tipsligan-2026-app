/**
 * Returns the ISO 8601 week number for a given date.
 * Week 1 = the week containing the first Thursday of the year (ISO 8601).
 */
export function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Returns the localised Swedish month name with year, e.g. "Februari 2026".
 * Uses Intl.DateTimeFormat with locale "sv-SE".
 */
export function getSwedishMonthLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  const monthName = new Intl.DateTimeFormat("sv-SE", {
    month: "long",
  }).format(date);
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
}
