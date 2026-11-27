import { test } from 'node:test'
import assert from 'node:assert/strict'
import { argRows, formatValue } from './confirm-args.ts'

const labels = { items: (n: number) => `${n} elementi`, movements: (n: number) => `${n} movimenti` }

test('formatValue renders scalars, short and long arrays, and flat objects on one line', () => {
  assert.equal(formatValue(null), '—')
  assert.equal(formatValue(42), '42')
  assert.equal(formatValue([1, 2, 3]), '1, 2, 3')
  assert.equal(formatValue([1, 2, 3, 4, 5, 6, 7, 8]), '1, 2, 3, 4, 5, 6 … (8)')
  assert.equal(formatValue({ transaction_id: 7, category: 'svago' }), 'transaction_id: 7 · category: svago')
})

test('bulk category updates are grouped by category, with one readable line per item', () => {
  const rows = argRows(
    {
      updates: [
        { transaction_id: 1, category: 'spesa' },
        { transaction_id: 2, category: 'svago' },
        { transaction_id: 3, category: 'spesa' },
      ],
    },
    labels,
  )
  assert.deepEqual(rows, [
    {
      key: 'updates',
      summary: '2 movimenti → spesa · 1 → svago',
      items: ['transaction_id: 1 · category: spesa', 'transaction_id: 2 · category: svago', 'transaction_id: 3 · category: spesa'],
    },
  ])
})

test('other arrays of objects get a count and their lines; scalars stay inline', () => {
  const rows = argRows({ ids: [1, 2], resolutions: [{ id: 5, action: 'keep_both' }], note: 'x' }, labels)
  assert.deepEqual(rows, [
    { key: 'ids', summary: '1, 2' },
    { key: 'resolutions', summary: '1 elementi', items: ['id: 5 · action: keep_both'] },
    { key: 'note', summary: 'x' },
  ])
  assert.deepEqual(argRows(undefined, labels), [])
})
