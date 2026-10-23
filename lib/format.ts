// Number and date formatting follows the UI language: I18nProvider calls setFormatLocale on every render.
let formatLocale = 'it-IT'

export function setFormatLocale(locale: string) {
  formatLocale = locale
}

/**
 * Format a number as currency.
 * Uses the provided currency code (ISO 4217) or defaults to EUR.
 * When compact=true, uses abbreviated notation (1K, 1M).
 */
export function formatCurrency(
  value: number | undefined,
  currency = 'EUR',
  compact = false,
): string {
  if (value === undefined) return '0'
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency ?? 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
    ...(compact ? { notation: 'compact' as const } : {}),
  }
  return new Intl.NumberFormat(formatLocale, opts).format(value)
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number | undefined): string {
  if (value === undefined) return '0%'
  return `${new Intl.NumberFormat(formatLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`
}

/**
 * Format an ISO 8601 date string (YYYY-MM-DD) to a human-readable date.
 * A bare date is read as a calendar day, not as UTC midnight, so it never shifts with the timezone.
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString(formatLocale, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Short axis number (12 mila, 1,5 Mln) without currency or decimals noise. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat(formatLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
