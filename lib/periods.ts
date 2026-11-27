/** Date presets of the charts: "1M" is the current calendar month, "3M" the current one plus the two before, and so on. */

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** First day of the month `months - 1` months before `today`'s month (months = 1 → first of this month). */
export function periodStart(months: number, today: Date = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), 1) // day 1 first: shifting Mar 31 by a month would overflow
  d.setMonth(d.getMonth() - (Math.max(1, months) - 1))
  return isoDate(d)
}
