import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accountTypeFor, consentDaysLeft, consentState, isTradeRepublic, parseCallbackUrl, summarizeReport } from './banking.ts'

const now = new Date('2026-11-21T10:00:00Z')

test('consent days and state', () => {
  assert.equal(consentDaysLeft('2026-12-21T10:00:00Z', now), 30)
  assert.equal(consentState('2026-12-21T10:00:00Z', now), 'ok')
  assert.equal(consentState('2026-11-30T10:00:00Z', now), 'expiring')
  assert.equal(consentState('2026-11-20T10:00:00Z', now), 'expired')
  assert.equal(consentState(null, now), 'unknown')
  assert.equal(consentDaysLeft('garbage', now), null)
})

test('app account type from the bank account type and label', () => {
  assert.equal(accountTypeFor('CACC'), 'checking')
  assert.equal(accountTypeFor('SVGS', 'Vault'), 'savings')
  assert.equal(accountTypeFor('CARD', 'Visa Platinum'), 'credit')
  assert.equal(accountTypeFor('CARD', 'Genius Card'), 'prepaid')
  assert.equal(accountTypeFor('CARD', 'Carta prepagata'), 'prepaid')
  assert.equal(accountTypeFor('LOAN'), 'other')
  assert.equal(accountTypeFor(null), 'other')
})

test('callback url parsing', () => {
  assert.deepEqual(parseCallbackUrl('http://127.0.0.1:8000/banking/callback?code=abc&state=xyz'), { code: 'abc', state: 'xyz', error: undefined })
  assert.deepEqual(parseCallbackUrl('?code=abc&state=xyz'), { code: 'abc', state: 'xyz', error: undefined })
  assert.deepEqual(parseCallbackUrl('http://x/cb?error=access_denied&error_description=User%20cancelled'), { code: undefined, state: undefined, error: 'User cancelled' })
  assert.equal(parseCallbackUrl('   '), null)
  assert.equal(parseCallbackUrl('http://x/cb?foo=1'), null)
})

test('sync report summary', () => {
  const t = (key: string, vars?: Record<string, string | number>) => `${key.split('.').pop()}${vars ? `(${vars.n})` : ''}`
  const summary = summarizeReport(
    {
      connection_id: 1,
      workspace_id: 1,
      status: 'partial',
      error: null,
      accounts: [
        { link_id: 1, account_id: 5, balance_recorded: true, transactions_fetched: 3, transactions_added: 2, transactions_skipped: 1, suspect_duplicates: 1, without_description: 0, error: null },
        { link_id: 2, account_id: 6, balance_recorded: false, transactions_fetched: 0, transactions_added: 0, transactions_skipped: 0, suspect_duplicates: 0, without_description: 0, error: 'ASPSP_TIMEOUT: slow' },
      ],
    },
    t,
  )
  assert.equal(summary, 'partial · syncAdded(2) · syncBalances(1) · syncSuspects(1) · ASPSP_TIMEOUT: slow')
  assert.equal(
    summarizeReport({ connection_id: 1, workspace_id: 1, status: 'skipped', error: 'connection is expired', accounts: [] }, t),
    'skipped · connection is expired',
  )
})

test('trade republic detection', () => {
  assert.equal(isTradeRepublic('Trade Republic'), true)
  assert.equal(isTradeRepublic('TradeRepublic Bank'), true)
  assert.equal(isTradeRepublic('UniCredit'), false)
})
