/**
 * Pure helpers for the Advisor page and the profile cards. No imports on purpose: unit-tested with
 * `node --test` (see profile-edit.test.ts).
 */

export interface KeyedItem {
  key: string
  label: string
}

/** Lowercase ascii key, same idea as the API's slugify: "Anticipo casa" -> "anticipo_casa". */
export function slugify(text: string): string {
  const ascii = text.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  const slug = ascii.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64)
  return slug || 'x'
}

/** A key derived from ``label`` that none of ``items`` uses. */
export function uniqueKey(label: string, items: KeyedItem[]): string {
  const taken = new Set(items.map((i) => i.key))
  const base = slugify(label)
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base.slice(0, 60)}_${i}`)) i++
  return `${base.slice(0, 60)}_${i}`
}

/**
 * A partial profile document that sets one field: "situation.income.net_monthly" -> {situation: {income: {net_monthly: v}}}.
 * The API merges nested dictionaries, so each blur can be sent as a small patch.
 */
export function patchAt(path: string, value: unknown): Record<string, unknown> {
  const parts = path.split('.').filter(Boolean)
  if (parts.length === 0) throw new Error('empty path')
  const root: Record<string, unknown> = {}
  let cursor = root
  parts.forEach((part, i) => {
    if (i === parts.length - 1) {
      cursor[part] = value
    } else {
      const next: Record<string, unknown> = {}
      cursor[part] = next
      cursor = next
    }
  })
  return root
}

/** A number from an input's text: empty -> null, comma accepted as decimal separator, garbage -> undefined. */
export function parseNumber(text: string): number | null | undefined {
  const trimmed = text.trim()
  if (!trimmed) return null
  const n = Number(trimmed.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

/** Sum of the allocation weights and whether the API will accept it (100 ± 0.5, or an empty allocation). */
export function allocationCheck(targets: { weight: number }[]): { total: number; ok: boolean } {
  const total = Math.round(targets.reduce((s, t) => s + (Number.isFinite(t.weight) ? t.weight : 0), 0) * 100) / 100
  return { total, ok: targets.length === 0 || Math.abs(total - 100) <= 0.5 }
}

/** "3,2 mesi su 6" style text: months covered against the target, with one decimal. */
export function formatMonthsCovered(covered: number | null, target: number, locale = 'it-IT'): string {
  const fmt = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n)
  if (covered === null) return `– / ${fmt(target)}`
  return `${fmt(covered)} / ${fmt(target)}`
}

/** The interview blocks in the order the discovery follows; `completeness` comes from the API. */
export const PROFILE_BLOCKS = ['income', 'expenses', 'emergency_fund', 'debts', 'housing', 'pension', 'goals', 'risk', 'ips'] as const

export function completenessShare(completeness: Record<string, boolean>): number {
  const total = PROFILE_BLOCKS.length
  const done = PROFILE_BLOCKS.filter((b) => completeness[b]).length
  return total ? done / total : 0
}

/** Severity order for the review checks: critical first. */
export const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 }

export function sortChecks<T extends { severity: string }>(checks: T[]): T[] {
  return [...checks].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))
}
