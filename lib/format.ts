/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number | undefined): string {
  if (value === undefined) return '$0'
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number | undefined): string {
  if (value === undefined) return '0%'
  return `${value.toFixed(2)}%`
}
