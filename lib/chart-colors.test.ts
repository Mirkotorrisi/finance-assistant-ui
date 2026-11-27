import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHART_PALETTE, categoryColor, distinctColors, hashIndex } from './chart-colors.ts'

const ITALIAN = [
  'Tasse da lavoro', 'Giroconti', 'Mutuo: rate', 'Spesa alimentare', 'Ristorazione', 'Utenze', 'Servizi',
  'Acquisti', 'Trasporti', 'Amazon', 'uncategorized', 'Asilo figlia', 'Neonato', 'Trasferimenti', 'Svago',
  'Salute',
]

test('hashIndex stays inside the palette', () => {
  for (const name of ITALIAN) {
    const i = hashIndex(name)
    assert.ok(i >= 0 && i < CHART_PALETTE.length, name)
  }
})

test('distinctColors gives every name its own color while the palette lasts', () => {
  const colors = distinctColors(ITALIAN)
  assert.equal(colors.size, ITALIAN.length)
  assert.equal(new Set(colors.values()).size, ITALIAN.length)
  for (const c of colors.values()) assert.ok(CHART_PALETTE.includes(c))
})

test('distinctColors does not depend on the input order and keeps colors that do not clash', () => {
  const a = distinctColors(ITALIAN)
  const b = distinctColors([...ITALIAN].reverse())
  assert.deepEqual([...a.entries()].sort(), [...b.entries()].sort())
  // a lone name keeps its plain categoryColor
  assert.equal(distinctColors(['Svago']).get('Svago'), categoryColor('Svago'))
})

test('semantic categories keep their fixed color and other names avoid it', () => {
  const colors = distinctColors(['groceries', 'Groceries ', 'x'])
  assert.equal(colors.get('groceries'), categoryColor('groceries'))
  assert.equal(colors.get('Groceries '), categoryColor('groceries'))
  assert.notEqual(colors.get('x'), colors.get('groceries'))
})

test('more names than palette colors still all get a color', () => {
  const many = Array.from({ length: CHART_PALETTE.length + 5 }, (_, i) => `cat ${i}`)
  const colors = distinctColors(many)
  assert.equal(colors.size, many.length)
  assert.equal(new Set(colors.values()).size, CHART_PALETTE.length)
})
