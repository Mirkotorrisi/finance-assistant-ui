import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildFlowRows, buildSnapshots, guessAccountType, matchAccount, monthEnd, snapshotDate } from './net-worth.ts'
import type { SheetPreview } from './types/net-worth.ts'

const sheet: SheetPreview = {
  year: 2026,
  balances: [
    { name: 'UNICREDIT', values: { '1': 95841, '2': 102027 } },
    { name: 'TRADE INVESTIMENTI', values: { '1': 4246 } },
  ],
  flows: [
    { label: 'UNICREDIT', income: { '1': 4205 }, expenses: { '1': 1564, '2': 1169 } },
    { label: 'TRADE REP', income: {}, expenses: { '1': 1294 } },
  ],
  notes: [{ month: 1, text: 'Divano e macchina anticipo' }],
}

test('month ends, including leap years', () => {
  assert.equal(monthEnd(2026, 1), '2026-01-31')
  assert.equal(monthEnd(2026, 2), '2026-02-28')
  assert.equal(monthEnd(2028, 2), '2028-02-29')
  assert.equal(monthEnd(2026, 12), '2026-12-31')
})

test('account type is guessed from the wording of the column', () => {
  assert.equal(guessAccountType('TRADE INVESTIMENTI'), 'investment')
  assert.equal(guessAccountType('Revolut Investimenti'), 'investment')
  assert.equal(guessAccountType('CONTANTI'), 'cash')
  assert.equal(guessAccountType('UNICREDIT'), 'checking')
})

test('a column matches the account with the same name, else the only one that contains it', () => {
  const accounts = [{ id: 1, name: 'Unicredit' }, { id: 2, name: 'Revolut' }, { id: 3, name: 'Revolut Investimenti' }]
  assert.equal(matchAccount('UNICREDIT', accounts)?.id, 1)
  assert.equal(matchAccount('REVOLUT', accounts)?.id, 2) // exact beats partial
  assert.equal(matchAccount('Unicredit conto', accounts)?.id, 1)
  assert.equal(matchAccount('FINECO', accounts), undefined)
  assert.equal(matchAccount('Rev', [{ id: 2, name: 'Revolut' }, { id: 3, name: 'Revolut Investimenti' }]), undefined)
})

test('snapshots: only mapped columns, month ends, the note on the first column of that month', () => {
  const out = buildSnapshots(sheet, 2026, { UNICREDIT: 1, 'TRADE INVESTIMENTI': 9 }, new Date(2026, 9, 25))
  assert.deepEqual(out, [
    { account_id: 1, date: '2026-01-31', balance: 95841, note: 'Divano e macchina anticipo' },
    { account_id: 9, date: '2026-01-31', balance: 4246 },
    { account_id: 1, date: '2026-02-28', balance: 102027 },
  ])
  assert.deepEqual(buildSnapshots(sheet, 2026, { UNICREDIT: undefined }), [])
})

test('flow rows carry what the sheet states, per month and account', () => {
  const rows = buildFlowRows(sheet, 2026, { UNICREDIT: 1, 'TRADE REP': 9 })
  assert.deepEqual(rows, [
    { month: '2026-01', account_id: 1, income: 4205, expenses: 1564 },
    { month: '2026-01', account_id: 9, expenses: 1294 },
    { month: '2026-02', account_id: 1, expenses: 1169 },
  ])
})

test('the month in progress is dated today, finished months at their end', () => {
  const today = new Date(2026, 9, 25)
  assert.equal(snapshotDate(2026, 10, today), '2026-10-25')
  assert.equal(snapshotDate(2026, 9, today), '2026-09-30')
  assert.equal(snapshotDate(2026, 11, today), '2026-10-25')
})
