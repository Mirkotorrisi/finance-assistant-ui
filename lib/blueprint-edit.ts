/**
 * Pure, immutable operations on a blueprint draft, used by the editor.
 * No imports on purpose: it is unit-tested with `node --test` (see blueprint-edit.test.ts).
 */

export interface Cat {
  key: string
  label: string
  description?: string
  examples?: string[]
  aliases?: string[]
  kind?: 'expense' | 'income'
  attributes?: Record<string, unknown>
  children?: Cat[]
}

export interface Group {
  key: string
  label: string
  description?: string
  members: string[]
}

export interface Draft {
  name: string
  categories?: Cat[]
  groups?: Group[]
  reports?: { key: string; label: string; group?: string | null; categories?: string[] }[]
  rules?: { pattern: string; category: string }[]
  dimensions?: { key: string; label: string; values: { key: string; label: string }[] }[]
}

export const MAX_DEPTH = 4

/** Lowercase ascii key, same idea as the API's slugify: "Spese d'ufficio" -> "spese_d_ufficio". */
export function slugify(text: string): string {
  const ascii = text.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  const slug = ascii.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64)
  return slug || 'x'
}

export function allKeys(nodes: Cat[] = [], into = new Set<string>()): Set<string> {
  for (const n of nodes) {
    into.add(n.key)
    allKeys(n.children, into)
  }
  return into
}

/** A key derived from ``label`` that is not in ``taken``. */
export function uniqueKey(label: string, taken: Set<string>): string {
  const base = slugify(label)
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base.slice(0, 60)}_${i}`)) i++
  return `${base.slice(0, 60)}_${i}`
}

export function flatten(nodes: Cat[] = [], depth = 0, out: { node: Cat; depth: number }[] = []) {
  for (const n of nodes) {
    out.push({ node: n, depth })
    flatten(n.children, depth + 1, out)
  }
  return out
}

export function find(nodes: Cat[] = [], key: string): Cat | undefined {
  for (const n of nodes) {
    if (n.key === key) return n
    const inner = find(n.children, key)
    if (inner) return inner
  }
  return undefined
}

/** The key and every key below it. */
export function subtreeKeys(nodes: Cat[] = [], key: string): string[] {
  const node = find(nodes, key)
  return node ? [...allKeys([node])] : []
}

function height(node: Cat): number {
  return 1 + Math.max(0, ...(node.children ?? []).map(height))
}

function depthOf(nodes: Cat[], key: string, depth = 1): number {
  for (const n of nodes) {
    if (n.key === key) return depth
    const inner = depthOf(n.children ?? [], key, depth + 1)
    if (inner) return inner
  }
  return 0
}

export function updateNode(nodes: Cat[] = [], key: string, fn: (n: Cat) => Cat): Cat[] {
  return nodes.map((n) =>
    n.key === key ? fn(n) : n.children && n.children.length ? { ...n, children: updateNode(n.children, key, fn) } : n,
  )
}

/** Change a label. The old label becomes an alias, so transactions that used it keep resolving. */
export function renameLabel(nodes: Cat[] = [], key: string, label: string): Cat[] {
  return updateNode(nodes, key, (n) => {
    const trimmed = label
    if (trimmed === n.label) return n
    const aliases = new Set(n.aliases ?? [])
    if (n.label.trim() && slugify(n.label) !== slugify(trimmed)) aliases.add(n.label)
    aliases.delete(trimmed) // never an alias of itself
    return { ...n, label: trimmed, aliases: [...aliases] }
  })
}

/** Add under ``parentKey`` (null: top level). Refuses to go deeper than MAX_DEPTH. */
export function addCategory(nodes: Cat[] = [], parentKey: string | null, node: Cat): Cat[] {
  if (parentKey === null) return [...nodes, node]
  if (depthOf(nodes, parentKey) + height(node) > MAX_DEPTH) return nodes
  return updateNode(nodes, parentKey, (p) => ({ ...p, children: [...(p.children ?? []), node] }))
}

export function removeCategory(nodes: Cat[] = [], key: string): Cat[] {
  return nodes
    .filter((n) => n.key !== key)
    .map((n) => (n.children && n.children.length ? { ...n, children: removeCategory(n.children, key) } : n))
}

/** Drop every reference to the removed categories from groups, rules and reports. */
export function dropReferences<T extends Draft>(draft: T, removed: string[]): T {
  const gone = new Set(removed)
  const groups = (draft.groups ?? []).map((g) => ({ ...g, members: g.members.filter((m) => !gone.has(m)) }))
  const groupKeys = new Set(groups.map((g) => g.key))
  return {
    ...draft,
    groups,
    rules: (draft.rules ?? []).filter((r) => !gone.has(r.category)),
    reports: (draft.reports ?? [])
      .map((r) => ({ ...r, categories: (r.categories ?? []).filter((c) => !gone.has(c)) }))
      .filter((r) => (r.group ? groupKeys.has(r.group) : (r.categories ?? []).length > 0)),
  }
}

/** Remove a category and its subtree from the draft, with every reference to them. */
export function deleteCategory<T extends Draft>(draft: T, key: string): T {
  const removed = subtreeKeys(draft.categories, key)
  return dropReferences({ ...draft, categories: removeCategory(draft.categories, key) }, removed)
}

function siblingsOf(nodes: Cat[], key: string): Cat[] | null {
  if (nodes.some((n) => n.key === key)) return nodes
  for (const n of nodes) {
    const inner = siblingsOf(n.children ?? [], key)
    if (inner) return inner
  }
  return null
}

function replaceSiblings(nodes: Cat[], key: string, fn: (siblings: Cat[]) => Cat[]): Cat[] {
  if (nodes.some((n) => n.key === key)) return fn(nodes)
  return nodes.map((n) => (n.children && n.children.length ? { ...n, children: replaceSiblings(n.children, key, fn) } : n))
}

/** Move up (-1) or down (+1) among siblings. */
export function moveWithinSiblings(nodes: Cat[] = [], key: string, delta: -1 | 1): Cat[] {
  return replaceSiblings(nodes, key, (siblings) => {
    const i = siblings.findIndex((n) => n.key === key)
    const j = i + delta
    if (i < 0 || j < 0 || j >= siblings.length) return siblings
    const copy = [...siblings]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    return copy
  })
}

/** Make the category the last child of the sibling above it. */
export function indent(nodes: Cat[] = [], key: string): Cat[] {
  const siblings = siblingsOf(nodes, key)
  if (!siblings) return nodes
  const i = siblings.findIndex((n) => n.key === key)
  if (i <= 0) return nodes
  const node = siblings[i]
  const target = siblings[i - 1]
  if (depthOf(nodes, target.key) + height(node) > MAX_DEPTH) return nodes
  const without = removeCategory(nodes, key)
  return updateNode(without, target.key, (t) => ({ ...t, children: [...(t.children ?? []), node] }))
}

/** Make the category the next sibling of its parent. */
export function outdent(nodes: Cat[] = [], key: string): Cat[] {
  const walk = (level: Cat[]): Cat[] | null => {
    for (let i = 0; i < level.length; i++) {
      const parent = level[i]
      const child = (parent.children ?? []).find((c) => c.key === key)
      if (child) {
        const updated = { ...parent, children: (parent.children ?? []).filter((c) => c.key !== key) }
        return [...level.slice(0, i), updated, child, ...level.slice(i + 1)]
      }
      const inner = walk(parent.children ?? [])
      if (inner) return [...level.slice(0, i), { ...parent, children: inner }, ...level.slice(i + 1)]
    }
    return null
  }
  return walk(nodes) ?? nodes
}

export function isDirty(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}

/** Change a category's key everywhere it is referenced. Only for categories that were never saved. */
export function rekey<T extends Draft>(draft: T, from: string, to: string): T {
  if (from === to) return draft
  const swap = (k: string) => (k === from ? to : k)
  return {
    ...draft,
    categories: updateNode(draft.categories, from, (n) => ({ ...n, key: to })),
    groups: (draft.groups ?? []).map((g) => ({ ...g, members: g.members.map(swap) })),
    rules: (draft.rules ?? []).map((r) => ({ ...r, category: swap(r.category) })),
    reports: (draft.reports ?? []).map((r) => ({ ...r, categories: (r.categories ?? []).map(swap) })),
  }
}

/**
 * Rename from the editor. A category already in the saved blueprint keeps its key and remembers the old label as an
 * alias; a new one (``isNew``) simply gets a key matching its new name.
 */
export function renameCategory<T extends Draft>(draft: T, key: string, label: string, isNew: boolean): T {
  if (!isNew) return { ...draft, categories: renameLabel(draft.categories, key, label) }
  const renamed = { ...draft, categories: updateNode(draft.categories, key, (n) => ({ ...n, label })) }
  const taken = allKeys(draft.categories)
  taken.delete(key)
  return rekey(renamed, key, uniqueKey(label, taken))
}

function freshKey(label: string, others: string[]): string {
  return uniqueKey(label, new Set(others))
}

/** Rename a group. A never-saved group gets a key matching its name (and the reports that use it follow). */
export function renameGroup<T extends Draft>(draft: T, key: string, label: string, isNew: boolean): T {
  const groups = draft.groups ?? []
  if (!isNew) return { ...draft, groups: groups.map((g) => (g.key === key ? { ...g, label } : g)) }
  const next = freshKey(label, groups.filter((g) => g.key !== key).map((g) => g.key))
  return {
    ...draft,
    groups: groups.map((g) => (g.key === key ? { ...g, label, key: next } : g)),
    reports: (draft.reports ?? []).map((r) => (r.group === key ? { ...r, group: next } : r)),
  }
}

/** Rename a dimension; a never-saved one gets a key matching its name. */
export function renameDimension<T extends Draft>(draft: T, key: string, label: string, isNew: boolean): T {
  const dims = draft.dimensions ?? []
  const next = isNew ? freshKey(label, dims.filter((d) => d.key !== key).map((d) => d.key)) : key
  return { ...draft, dimensions: dims.map((d) => (d.key === key ? { ...d, label, key: next } : d)) }
}

/** Rename a value of a dimension; a never-saved value gets a key matching its name. */
export function renameDimensionValue<T extends Draft>(
  draft: T, dimensionKey: string, valueKey: string, label: string, isNew: boolean,
): T {
  return {
    ...draft,
    dimensions: (draft.dimensions ?? []).map((d) => {
      if (d.key !== dimensionKey) return d
      const next = isNew ? freshKey(label, d.values.filter((v) => v.key !== valueKey).map((v) => v.key)) : valueKey
      return { ...d, values: d.values.map((v) => (v.key === valueKey ? { key: next, label } : v)) }
    }),
  }
}
