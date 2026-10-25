/** Pure helpers for importing a monthly sheet: matching its columns to accounts and building the snapshots. */

import type { FlowCheckInput, SheetPreview, SnapshotInput } from './types/net-worth'

interface AccountLike {
  id: number
  name: string
}

export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Brokerage-like wording means a market value, cash wording a cash account, everything else a bank account. */
export function guessAccountType(name: string): 'investment' | 'cash' | 'checking' {
  const n = normalize(name)
  if (/(invest|titoli|etf|azioni|broker|pensione|pac)/.test(n)) return 'investment'
  if (/(contanti|cash|portafoglio)/.test(n)) return 'cash'
  return 'checking'
}

/** The existing account a sheet column most likely means: same name, else one name contains the other. */
export function matchAccount(label: string, accounts: AccountLike[]): AccountLike | undefined {
  const wanted = normalize(label)
  if (!wanted) return undefined
  const exact = accounts.find((a) => normalize(a.name) === wanted)
  if (exact) return exact
  const partial = accounts.filter((a) => {
    const n = normalize(a.name)
    return n.length > 2 && (n.includes(wanted) || wanted.includes(n))
  })
  return partial.length === 1 ? partial[0] : undefined
}

export function monthEnd(year: number, month: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

/** The last day of the month, or `today` when the month is not over yet (a balance cannot be dated in the future). */
export function snapshotDate(year: number, month: number, today: Date = new Date()): string {
  const end = monthEnd(year, month)
  const now = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return end > now ? now : end
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * One snapshot per mapped column and month, dated the last day of the month (today for the month in progress). The sheet's free-text notes
 * (e.g. "Estinzione parziale mutuo") go on the first mapped column's snapshot of that month.
 */
export function buildSnapshots(
  sheet: SheetPreview,
  year: number,
  accountByColumn: Record<string, number | undefined>,
  today: Date = new Date(),
): SnapshotInput[] {
  const notes = new Map(sheet.notes.map((n) => [String(n.month), n.text]))
  const out: SnapshotInput[] = []
  const noted = new Set<string>()
  for (const column of sheet.balances) {
    const accountId = accountByColumn[column.name]
    if (accountId === undefined) continue
    for (const [month, balance] of Object.entries(column.values)) {
      const snapshot: SnapshotInput = { account_id: accountId, date: snapshotDate(year, Number(month), today), balance }
      const note = notes.get(month)
      if (note && !noted.has(month)) {
        snapshot.note = note
        noted.add(month)
      }
      out.push(snapshot)
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.account_id - b.account_id)
}

/** Income/expenses the sheet states, per month and account, to cross-check against the transactions. */
export function buildFlowRows(
  sheet: SheetPreview,
  year: number,
  accountByFlow: Record<string, number | undefined>,
): FlowCheckInput[] {
  const out: FlowCheckInput[] = []
  for (const flow of sheet.flows) {
    const accountId = accountByFlow[flow.label]
    if (accountId === undefined) continue
    const months = new Set([...Object.keys(flow.income), ...Object.keys(flow.expenses)])
    for (const month of months) {
      const row: FlowCheckInput = { month: monthKey(year, Number(month)), account_id: accountId }
      if (flow.income[month] !== undefined) row.income = flow.income[month]
      if (flow.expenses[month] !== undefined) row.expenses = flow.expenses[month]
      out.push(row)
    }
  }
  return out.sort((a, b) => a.month.localeCompare(b.month) || a.account_id - b.account_id)
}
