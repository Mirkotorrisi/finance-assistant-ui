import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avgCost, basisKey, countAtCost, isStale, needsAttention, securitiesAccountName, sortAllocation } from './portfolio.ts'

test('average cost per unit', () => {
  assert.equal(avgCost(1000, 2), 500)
  assert.equal(avgCost(1000, null), null)
  assert.equal(avgCost(1000, 0), null)
})

test('stale closes', () => {
  const now = new Date('2026-11-21T10:00:00Z')
  assert.equal(isStale('2026-11-20', now), false)
  assert.equal(isStale('2026-11-10', now), true)
  assert.equal(isStale(null, now), false)
  assert.equal(isStale('garbage', now), false)
})

test('basis badge and attention', () => {
  assert.equal(basisKey('market'), 'market')
  assert.equal(basisKey('cost'), 'cost')
  assert.equal(basisKey('no_fx'), 'noPrice')
  assert.equal(needsAttention({ price_basis: 'no_price' }), true)
  assert.equal(needsAttention({ price_basis: 'cost' }), false)
  assert.equal(countAtCost([{ price_basis: 'cost' }, { price_basis: 'market' }, { price_basis: 'cost' }]), 2)
})

test('allocation sorted and normalised', () => {
  const out = sortAllocation([
    { asset_class: 'bonds', value: 250, weight: 0 },
    { asset_class: 'equity', value: 750, weight: 0 },
  ])
  assert.deepEqual(out.map((s) => s.asset_class), ['equity', 'bonds'])
  assert.deepEqual(out.map((s) => s.weight), [75, 25])
  assert.deepEqual(sortAllocation([]), [])
})

test('securities account name', () => {
  assert.equal(securitiesAccountName('Trade Republic'), 'Trade Republic titoli')
  assert.equal(securitiesAccountName('Fineco titoli'), 'Fineco titoli')
  assert.equal(securitiesAccountName(null), 'Broker titoli')
})
