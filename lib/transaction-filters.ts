/**
 * Pure helpers for the client-side filters of the transactions table:
 * category chips (hide/show, all/none) and account chips.
 */

import type { Transaction } from './types/transaction'

/** Key used for transactions that have no account. */
export const NO_ACCOUNT = 'none'

export type AccountKey = number | typeof NO_ACCOUNT

export interface AccountOption {
  key: AccountKey
  name: string
  count: number
}

export function accountKey(tx: Pick<Transaction, 'account_id'>): AccountKey {
  return tx.account_id ?? NO_ACCOUNT
}

/** Adds the key when missing, removes it when present. Never mutates the input. */
export function toggleIn<T>(set: Set<T>, key: T): Set<T> {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

/**
 * The accounts the loaded transactions belong to, with how many rows each has,
 * sorted by name; the "no account" option, when present, comes last.
 */
export function accountOptions(
  transactions: Pick<Transaction, 'account_id'>[],
  names: Map<number, string>,
  noAccountLabel: string,
): AccountOption[] {
  const counts = new Map<AccountKey, number>()
  for (const tx of transactions) {
    const key = accountKey(tx)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const options: AccountOption[] = []
  for (const [key, count] of counts) {
    const name = key === NO_ACCOUNT ? noAccountLabel : names.get(key) ?? `#${key}`
    options.push({ key, name, count })
  }
  return options.sort((a, b) => {
    if (a.key === NO_ACCOUNT) return 1
    if (b.key === NO_ACCOUNT) return -1
    return a.name.localeCompare(b.name)
  })
}

/** The rows that pass both chip filters. */
export function visibleTransactions<T extends Pick<Transaction, 'category' | 'account_id'>>(
  transactions: T[],
  hiddenCategories: Set<string>,
  hiddenAccounts: Set<AccountKey>,
): T[] {
  if (hiddenCategories.size === 0 && hiddenAccounts.size === 0) return transactions
  return transactions.filter(
    (tx) => !hiddenCategories.has(tx.category) && !hiddenAccounts.has(accountKey(tx)),
  )
}
