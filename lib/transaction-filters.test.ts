import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NO_ACCOUNT, accountOptions, toggleIn, visibleTransactions } from './transaction-filters.ts'

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
