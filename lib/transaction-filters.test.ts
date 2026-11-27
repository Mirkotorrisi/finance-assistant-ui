import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SORT, NO_ACCOUNT, accountOptions, nextSort, sortTransactions, toggleIn, visibleTransactions } from './transaction-filters.ts'

const tx = (category: string, account_id: number | null) => ({ category, account_id })

test('toggleIn adds a missing key and removes a present one without mutating', () => {
  const start = new Set(['food'])
  const added = toggleIn(start, 'rent')
  assert.deepEqual([...added].sort(), ['food', 'rent'])
  assert.deepEqual([...start], ['food'])
  assert.deepEqual([...toggleIn(added, 'food')], ['rent'])
})

test('accountOptions counts rows per account, sorts by name and puts "no account" last', () => {
  const rows = [tx('food', 2), tx('rent', 1), tx('food', 2), tx('misc', null), tx('food', 3)]
  const names = new Map([[1, 'UniCredit'], [2, 'Revolut']])
  assert.deepEqual(accountOptions(rows, names, 'Senza conto'), [
    { key: 3, name: '#3', count: 1 }, // unknown account: the id is still shown
    { key: 2, name: 'Revolut', count: 2 },
    { key: 1, name: 'UniCredit', count: 1 },
    { key: NO_ACCOUNT, name: 'Senza conto', count: 1 },
  ])
})

test('visibleTransactions applies both chip filters', () => {
  const rows = [tx('food', 1), tx('rent', 1), tx('food', 2), tx('food', null)]
  assert.equal(visibleTransactions(rows, new Set(), new Set()), rows) // same array when nothing is hidden
  assert.deepEqual(visibleTransactions(rows, new Set(['rent']), new Set()), [rows[0], rows[2], rows[3]])
  assert.deepEqual(visibleTransactions(rows, new Set(), new Set([1])), [rows[2], rows[3]])
  assert.deepEqual(visibleTransactions(rows, new Set(['rent']), new Set([NO_ACCOUNT, 2])), [rows[0]])
})

const row = (id: number, date: string, amount: number, description: string, category: string, account_id: number | null) =>
  ({ id, date, amount, description, category, category_label: category.toUpperCase(), account_id })

test('nextSort flips the same column and starts a new one with its default direction', () => {
  assert.deepEqual(nextSort(DEFAULT_SORT, 'date'), { key: 'date', dir: 'asc' })
  assert.deepEqual(nextSort(DEFAULT_SORT, 'amount'), { key: 'amount', dir: 'asc' })
  assert.deepEqual(nextSort({ key: 'amount', dir: 'asc' }, 'amount'), { key: 'amount', dir: 'desc' })
  assert.deepEqual(nextSort({ key: 'amount', dir: 'desc' }, 'description'), { key: 'description', dir: 'asc' })
})

test('sortTransactions orders by amount, text columns and date, with a stable tie-break', () => {
  const rows = [
    row(1, '2026-11-01', -50, 'Coop', 'spesa', 1),
    row(2, '2026-11-03', 1200, 'Stipendio', 'reddito', 2),
    row(3, '2026-11-02', -50, 'amazon', 'acquisti', 1),
    row(4, '2026-11-02', -300, 'Affitto', 'casa', null),
  ]
  const names = (tx: { account_id: number | null }) => (tx.account_id === 1 ? 'Revolut' : tx.account_id === 2 ? 'UniCredit' : 'Senza conto')
  const ids = (xs: { id: number }[]) => xs.map((x) => x.id)
  assert.deepEqual(ids(sortTransactions(rows, { key: 'amount', dir: 'asc' }, names)), [4, 3, 1, 2]) // biggest expense first; equal amounts newest first
  assert.deepEqual(ids(sortTransactions(rows, { key: 'amount', dir: 'desc' }, names)), [2, 3, 1, 4])
  assert.deepEqual(ids(sortTransactions(rows, { key: 'description', dir: 'asc' }, names)), [4, 3, 1, 2]) // case-insensitive
  assert.deepEqual(ids(sortTransactions(rows, { key: 'account', dir: 'asc' }, names)), [3, 1, 4, 2])
  assert.deepEqual(ids(sortTransactions(rows, { key: 'category', dir: 'desc' }, names)), [1, 2, 4, 3])
  assert.deepEqual(ids(sortTransactions(rows, DEFAULT_SORT, names)), [2, 4, 3, 1]) // newest first, then higher id
  assert.notEqual(sortTransactions(rows, DEFAULT_SORT, names), rows) // a copy, never in place
})
