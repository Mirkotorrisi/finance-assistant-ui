import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addCategory, allKeys, deleteCategory, indent, isDirty, moveWithinSiblings, outdent, renameCategory, renameDimension,
  renameDimensionValue, renameGroup, renameLabel, slugify, uniqueKey,
  type Cat, type Draft,
} from './blueprint-edit.ts'

const tree = (): Cat[] => [
  { key: 'home', label: 'Home', children: [{ key: 'rent', label: 'Rent' }, { key: 'bills', label: 'Bills' }] },
  { key: 'fun', label: 'Fun' },
  { key: 'pay', label: 'Pay', kind: 'income' },
]
const keys = (nodes: Cat[]): string[] => nodes.flatMap((n) => [n.key, ...keys(n.children ?? [])])

test('slugify strips accents and punctuation', () => {
  assert.equal(slugify("Spese d'ufficio"), 'spese_d_ufficio')
  assert.equal(slugify('Caffè  &  Bar'), 'caffe_bar')
  assert.equal(slugify('   '), 'x')
})

test('uniqueKey never collides', () => {
  assert.equal(uniqueKey('Fun', new Set(['fun'])), 'fun_2')
  assert.equal(uniqueKey('Fun', new Set(['fun', 'fun_2'])), 'fun_3')
  assert.equal(uniqueKey('Fun', new Set()), 'fun')
})

test('renaming a label keeps the old one as an alias, and never aliases itself', () => {
  const renamed = renameLabel(tree(), 'fun', 'Leisure')
  const fun = renamed.find((n) => n.key === 'fun')!
  assert.equal(fun.label, 'Leisure')
  assert.deepEqual(fun.aliases, ['Fun'])
  const back = renameLabel(renamed, 'fun', 'Fun')
  assert.deepEqual(back.find((n) => n.key === 'fun')!.aliases, ['Leisure'])
  // only a change of case or accent is not a new name
  assert.equal(renameLabel(tree(), 'fun', 'FUN').find((n) => n.key === 'fun')!.aliases?.length ?? 0, 0)
  // renaming is immutable
  assert.equal(tree().find((n) => n.key === 'fun')!.aliases, undefined)
})

test('add under a parent or at the top, refusing to exceed the depth limit', () => {
  const nodes = addCategory(tree(), 'home', { key: 'tax', label: 'Tax' })
  assert.deepEqual(keys(nodes.find((n) => n.key === 'home')!.children!), ['rent', 'bills', 'tax'])
  assert.equal(addCategory(tree(), null, { key: 'new', label: 'New' }).length, 4)
  let deep: Cat[] = [{ key: 'a', label: 'a' }]
  deep = addCategory(deep, 'a', { key: 'b', label: 'b' })
  deep = addCategory(deep, 'b', { key: 'c', label: 'c' })
  deep = addCategory(deep, 'c', { key: 'd', label: 'd' })
  assert.equal(allKeys(deep).size, 4)
  assert.equal(allKeys(addCategory(deep, 'd', { key: 'e', label: 'e' })).size, 4) // a fifth level is refused
})

test('deleting a category removes its subtree and every reference to it', () => {
  const draft: Draft = {
    name: 'x',
    categories: tree(),
    groups: [{ key: 'g', label: 'G', members: ['home', 'fun'] }, { key: 'h', label: 'H', members: ['rent'] }],
    rules: [{ pattern: 'a', category: 'rent' }, { pattern: 'b', category: 'fun' }],
    reports: [
      { key: 'r1', label: 'R1', categories: ['rent'] },
      { key: 'r2', label: 'R2', group: 'g' },
      { key: 'r3', label: 'R3', group: 'h' },
    ],
  }
  const out = deleteCategory(draft, 'home')
  assert.deepEqual([...allKeys(out.categories)], ['fun', 'pay'])
  assert.deepEqual(out.groups!.map((g) => g.members), [['fun'], []])
  assert.deepEqual(out.rules, [{ pattern: 'b', category: 'fun' }])
  assert.deepEqual(out.reports!.map((r) => r.key), ['r2', 'r3']) // r1 had only removed categories; r3 still points at group h
})

test('move up and down among siblings, stopping at the ends', () => {
  assert.deepEqual(keys(moveWithinSiblings(tree(), 'fun', -1)), ['fun', 'home', 'rent', 'bills', 'pay'])
  assert.deepEqual(keys(moveWithinSiblings(tree(), 'rent', 1).find((n) => n.key === 'home')!.children!), ['bills', 'rent'])
  assert.deepEqual(keys(moveWithinSiblings(tree(), 'home', -1)), keys(tree()))
  assert.deepEqual(keys(moveWithinSiblings(tree(), 'pay', 1)), keys(tree()))
})

test('indent nests under the sibling above; outdent lifts out next to the parent', () => {
  const nested = indent(tree(), 'fun')
  assert.deepEqual(keys(nested.find((n) => n.key === 'home')!.children!), ['rent', 'bills', 'fun'])
  assert.equal(nested.length, 2)
  assert.deepEqual(keys(indent(tree(), 'home')), keys(tree())) // nothing above the first one
  const lifted = outdent(tree(), 'bills')
  assert.deepEqual(lifted.map((n) => n.key), ['home', 'bills', 'fun', 'pay'])
  assert.deepEqual(keys(lifted.find((n) => n.key === 'home')!.children!), ['rent'])
  assert.deepEqual(outdent(tree(), 'fun').map((n) => n.key), ['home', 'fun', 'pay']) // already top level
})

test('indent respects the depth limit', () => {
  let nodes: Cat[] = [{ key: 'a', label: 'a', children: [{ key: 'b', label: 'b', children: [{ key: 'c', label: 'c', children: [{ key: 'd', label: 'd' }] }] }] }, { key: 'x', label: 'x' }]
  assert.equal(indent(nodes, 'x').length, 1) // nested under "a" at level 2: allowed, so only "a" is left at the top
  nodes = [{ key: 'x', label: 'x', children: [{ key: 'y', label: 'y' }] }, { key: 'a', label: 'a', children: [{ key: 'b', label: 'b', children: [{ key: 'c', label: 'c', children: [{ key: 'd', label: 'd' }] }] }] }]
  assert.equal(indent(nodes, 'a').length, 2) // "a" (4 levels) under "x" would be 5: refused
})

test('isDirty compares by value', () => {
  assert.equal(isDirty(tree(), tree()), false)
  assert.equal(isDirty(tree(), renameLabel(tree(), 'fun', 'Other')), true)
})

test('renaming a never-saved category re-keys it everywhere; a saved one keeps its key and gets an alias', () => {
  const draft: Draft = {
    name: 'x',
    categories: [...tree(), { key: 'new_category', label: 'New category' }],
    groups: [{ key: 'g', label: 'G', members: ['new_category'] }],
    rules: [{ pattern: 'a', category: 'new_category' }],
  }
  const fresh = renameCategory(draft, 'new_category', 'Gifts & cards', true)
  assert.ok(allKeys(fresh.categories).has('gifts_cards') && !allKeys(fresh.categories).has('new_category'))
  assert.deepEqual(fresh.groups![0].members, ['gifts_cards'])
  assert.deepEqual(fresh.rules, [{ pattern: 'a', category: 'gifts_cards' }])
  assert.equal(fresh.categories!.find((n) => n.key === 'gifts_cards')!.aliases, undefined)

  const clash = renameCategory(draft, 'new_category', 'Fun', true) // "fun" is taken
  assert.ok(allKeys(clash.categories).has('fun_2'))

  const saved = renameCategory(draft, 'fun', 'Leisure', false)
  assert.ok(allKeys(saved.categories).has('fun'))
  assert.deepEqual(saved.categories!.find((n) => n.key === 'fun')!.aliases, ['Fun'])
})

test('groups, dimensions and values: new ones follow their name, saved ones keep their key', () => {
  const draft: Draft = {
    name: 'x',
    groups: [{ key: 'new_group', label: 'New group', members: [] }, { key: 'essentials', label: 'Essentials', members: [] }],
    reports: [{ key: 'r', label: 'R', group: 'new_group' }],
    dimensions: [{ key: 'new_dimension', label: 'New dimension', values: [{ key: 'new_value', label: 'New value' }, { key: 'kids', label: 'Kids' }] }],
  }
  const g = renameGroup(draft, 'new_group', 'Minchiate', true)
  assert.deepEqual(g.groups!.map((x) => x.key), ['minchiate', 'essentials'])
  assert.equal(g.reports![0].group, 'minchiate') // the report that used it follows
  assert.equal(renameGroup(draft, 'new_group', 'Essentials', true).groups![0].key, 'essentials_2') // no clash
  assert.equal(renameGroup(draft, 'essentials', 'Needs', false).groups![1].key, 'essentials') // saved: key is stable

  const d = renameDimension(draft, 'new_dimension', 'Per chi', true)
  assert.equal(d.dimensions![0].key, 'per_chi')
  assert.equal(renameDimension(draft, 'new_dimension', 'Per chi', false).dimensions![0].key, 'new_dimension')

  const v = renameDimensionValue(draft, 'new_dimension', 'new_value', 'Figli', true)
  assert.deepEqual(v.dimensions![0].values.map((x) => x.key), ['figli', 'kids'])
  assert.equal(renameDimensionValue(draft, 'new_dimension', 'kids', 'Children', false).dimensions![0].values[1].key, 'kids')
})
