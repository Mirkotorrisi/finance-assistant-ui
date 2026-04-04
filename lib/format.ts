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
    ...(compact ? { notation: 'compact' as const } : {}),
  }
  return new Intl.NumberFormat('en-US', opts).format(value)
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number | undefined): string {
  if (value === undefined) return '0%'
  return `${value.toFixed(2)}%`
}

/**
 * Format an ISO 8601 date string (YYYY-MM-DD) to a human-readable date.
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
