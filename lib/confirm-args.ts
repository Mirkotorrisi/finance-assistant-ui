/**
 * Pure rendering of the arguments of an action the agent proposed (ConfirmAction card).
 * Arrays of objects (e.g. `updates: [{transaction_id, category}]`) become a one-line summary
 * plus one readable line per item, instead of "[object Object]".
 */

export interface ArgRow {
  key: string
  /** One line, always present. */
  summary: string
  /** One line per element, for arrays of objects (shown in an expandable list). */
  items?: string[]
}

export interface ArgLabels {
  /** "{n} elementi" */
  items: (n: number) => string
  /** "{n} movimenti" */
  movements: (n: number) => string
}

const MAX_INLINE = 6

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** A scalar, an array of scalars or a flat object, on one line. */
export function formatValue(value: unknown): string {
  if (value == null) return '—'
  if (Array.isArray(value)) {
    const parts = value.map(formatValue)
    return parts.length > MAX_INLINE ? `${parts.slice(0, MAX_INLINE).join(', ')} … (${parts.length})` : parts.join(', ')
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(' · ')
  }
  return String(value)
}

/** Updates of the kind `{transaction_id, category}` grouped by category: "12 movimenti → spesa · 3 → svago". */
function groupedByCategory(items: Record<string, unknown>[], labels: ArgLabels): string | null {
  if (!items.every((it) => 'category' in it && ('transaction_id' in it || 'id' in it))) return null
  const counts = new Map<string, number>()
  for (const it of items) {
    const cat = String(it.category)
    counts.set(cat, (counts.get(cat) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n], i) => (i === 0 ? `${labels.movements(n)} → ${cat}` : `${n} → ${cat}`))
    .join(' · ')
}

export function argRows(args: Record<string, unknown> | undefined, labels: ArgLabels): ArgRow[] {
  return Object.entries(args ?? {}).map(([key, value]) => {
    if (Array.isArray(value) && value.length > 0 && value.every(isRecord)) {
      const objects = value as Record<string, unknown>[]
      const summary = groupedByCategory(objects, labels) ?? labels.items(objects.length)
      return { key, summary, items: objects.map(formatValue) }
    }
    return { key, summary: formatValue(value) }
  })
}
