/** Pure helpers for the portfolio views (unit-tested, no React). */

import type { AllocationSlice, PriceBasis, ValuedPosition } from '@/lib/types/portfolio'

export const STALE_AFTER_DAYS = 7

/** Average cost per unit of what is still held; null without a quantity. */
export function avgCost(openCost: number, quantity: number | null): number | null {
  if (!quantity || quantity <= 0) return null
  return openCost / quantity
}

/** A close older than STALE_AFTER_DAYS days is shown but flagged. */
export function isStale(priceDate: string | null, now = new Date(), days = STALE_AFTER_DAYS): boolean {
  if (!priceDate) return false
  const then = new Date(`${priceDate}T12:00:00`)
  if (Number.isNaN(then.getTime())) return false
  return (now.getTime() - then.getTime()) / 86_400_000 > days
}

/** Translation key suffix for a price basis badge. */
export function basisKey(basis: PriceBasis): 'market' | 'cost' | 'manual' | 'noPrice' {
  if (basis === 'market' || basis === 'cost' || basis === 'manual') return basis
  return 'noPrice'
}

/** Positions whose value needs the user's attention (no price, no quantity, no fx). */
export function needsAttention(position: Pick<ValuedPosition, 'price_basis'>): boolean {
  return position.price_basis === 'no_price' || position.price_basis === 'no_quantity' || position.price_basis === 'no_fx' || position.price_basis === 'unknown'
}

/** Allocation slices, heaviest first, with weights re-normalised to the slices given. */
export function sortAllocation(slices: AllocationSlice[]): AllocationSlice[] {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  return [...slices]
    .sort((a, b) => b.value - a.value)
    .map((s) => ({ ...s, weight: total > 0 ? Math.round((1000 * s.value) / total) / 10 : 0 }))
}

/** Count of positions valued at cost (no market price behind the figure). */
export function countAtCost(positions: Pick<ValuedPosition, 'price_basis'>[]): number {
  return positions.filter((p) => p.price_basis === 'cost').length
}

/** Default name for the securities account created next to a broker's cash account. */
export function securitiesAccountName(sourceName: string | null): string {
  const base = (sourceName ?? 'Broker').trim()
  return /titoli/i.test(base) ? base : `${base} titoli`
}
