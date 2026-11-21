import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  allocationCheck,
  completenessShare,
  formatMonthsCovered,
  parseNumber,
  patchAt,
  slugify,
  sortChecks,
  uniqueKey,
} from './profile-edit.ts'

test('keys are slugified like the API and made unique', () => {
  assert.equal(slugify('Anticipo casa'), 'anticipo_casa')
  assert.equal(slugify("Prestito dell'auto"), 'prestito_dell_auto')
  assert.equal(slugify('Università'), 'universita')
  assert.equal(slugify('!!!'), 'x')
  const items = [{ key: 'casa', label: 'Casa' }, { key: 'casa_2', label: 'Casa' }]
  assert.equal(uniqueKey('Casa', items), 'casa_3')
  assert.equal(uniqueKey('Auto', items), 'auto')
})

test('a field path becomes a nested patch', () => {
  assert.deepEqual(patchAt('situation.income.net_monthly', 2400), { situation: { income: { net_monthly: 2400 } } })
  assert.deepEqual(patchAt('notes', 'x'), { notes: 'x' })
  assert.throws(() => patchAt('', 1))
})

test('numbers are parsed from italian and english input', () => {
  assert.equal(parseNumber(''), null)
  assert.equal(parseNumber(' 1 200,50'), 1200.5)
  assert.equal(parseNumber('1200.50'), 1200.5)
  assert.equal(parseNumber('abc'), undefined)
})

test('allocation weights must add up to 100 unless empty', () => {
  assert.deepEqual(allocationCheck([]), { total: 0, ok: true })
  assert.deepEqual(allocationCheck([{ weight: 70 }, { weight: 30 }]), { total: 100, ok: true })
  assert.deepEqual(allocationCheck([{ weight: 70 }, { weight: 20 }]), { total: 90, ok: false })
  assert.equal(allocationCheck([{ weight: 33.3 }, { weight: 33.3 }, { weight: 33.3 }]).ok, true)
})

test('months covered reads as covered / target', () => {
  assert.equal(formatMonthsCovered(3.24, 6, 'en-US'), '3.2 / 6')
  assert.equal(formatMonthsCovered(null, 6, 'en-US'), '– / 6')
})

test('completeness share and check ordering', () => {
  assert.equal(completenessShare({ income: true, goals: true, risk: false }), 2 / 9)
  const sorted = sortChecks([{ severity: 'info' }, { severity: 'critical' }, { severity: 'warning' }])
  assert.deepEqual(sorted.map((c) => c.severity), ['critical', 'warning', 'info'])
})
