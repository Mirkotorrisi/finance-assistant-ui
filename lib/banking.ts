/** Pure helpers of the Banks page: consent validity, account types, callback parsing, sync summaries. */

import type { AccountSyncReport, CashAccountType, SyncReport } from './types/banking'

export const RENEWAL_WARNING_DAYS = 14

/** Whole days until the consent expires (negative when expired); null without a date. */
export function consentDaysLeft(validUntil: string | null | undefined, now: Date = new Date()): number | null {
  if (!validUntil) return null
  const end = new Date(validUntil)
  if (Number.isNaN(end.getTime())) return null
  return Math.floor((end.getTime() - now.getTime()) / 86_400_000)
}

export type ConsentState = 'ok' | 'expiring' | 'expired' | 'unknown'

export function consentState(validUntil: string | null | undefined, now: Date = new Date()): ConsentState {
  const days = consentDaysLeft(validUntil, now)
  if (days === null) return 'unknown'
  if (days < 0) return 'expired'
  if (days < RENEWAL_WARNING_DAYS) return 'expiring'
  return 'ok'
}

/** The app account type to create for a bank account the bank describes by ISO cash account type. */
export function accountTypeFor(cashAccountType: CashAccountType | string | null | undefined, label?: string | null): string {
  const text = (label ?? '').toLowerCase()
  switch (cashAccountType) {
    case 'CARD':
      return /prepag|genius|postepay/.test(text) ? 'prepaid' : 'credit'
    case 'SVGS':
      return 'savings'
    case 'CACC':
      return 'checking'
    case 'CASH':
      return 'cash'
    default:
      return 'other'
  }
}

/** code and state from the URL the bank sent the browser to (or null when it has neither). */
export function parseCallbackUrl(text: string): { code?: string; state?: string; error?: string } | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  let query: URLSearchParams
  try {
    query = new URL(trimmed).searchParams
  } catch {
    query = new URLSearchParams(trimmed.replace(/^\?/, ''))
  }
  const code = query.get('code') ?? undefined
  const state = query.get('state') ?? undefined
  const error = query.get('error_description') ?? query.get('error') ?? undefined
  if (!code && !state && !error) return null
  return { code, state, error }
}

export function sumReport(report: SyncReport, field: keyof Pick<AccountSyncReport, 'transactions_added' | 'suspect_duplicates' | 'transactions_fetched' | 'without_description'>): number {
  return report.accounts.reduce((acc, a) => acc + (a[field] ?? 0), 0)
}

/** A one-line description of a sync outcome; `t` supplies the translated pieces. */
export function summarizeReport(
  report: SyncReport,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const added = sumReport(report, 'transactions_added')
  const suspects = sumReport(report, 'suspect_duplicates')
  const balances = report.accounts.filter((a) => a.balance_recorded).length
  const parts = [t(`banking.syncStatus.${report.status}`)]
  if (report.status !== 'skipped') {
    parts.push(t('banking.syncAdded', { n: added }))
    if (balances) parts.push(t('banking.syncBalances', { n: balances }))
    if (suspects) parts.push(t('banking.syncSuspects', { n: suspects }))
  }
  const errors = report.accounts.filter((a) => a.error).map((a) => a.error)
  if (report.error) errors.unshift(report.error)
  if (errors.length) parts.push(errors.join('; '))
  return parts.join(' · ')
}

export const COUNTRIES = ['IT', 'DE', 'LT', 'FR', 'ES', 'NL', 'AT', 'BE', 'IE', 'PT', 'FI', 'SE', 'DK', 'NO', 'PL'] as const

export function isTradeRepublic(aspspName: string): boolean {
  return /trade\s*republic/i.test(aspspName)
}
