import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isoDate, periodStart } from './periods.ts'

test('1M starts on the first day of the current month', () => {
  assert.equal(periodStart(1, new Date(2026, 10, 27)), '2026-11-01')
  assert.equal(periodStart(1, new Date(2026, 10, 1)), '2026-11-01')
})

test('nM covers n calendar months including the current one, across year ends and long months', () => {
  assert.equal(periodStart(3, new Date(2026, 10, 27)), '2026-09-01')
  assert.equal(periodStart(6, new Date(2026, 1, 15)), '2025-09-01')
  assert.equal(periodStart(12, new Date(2026, 10, 27)), '2025-12-01')
  assert.equal(periodStart(2, new Date(2026, 2, 31)), '2026-02-01') // Mar 31 minus a month is not Mar 3
})

test('isoDate writes the local calendar day', () => {
  assert.equal(isoDate(new Date(2026, 0, 5)), '2026-01-05')
})
