export const CHART_PALETTE = [
  'oklch(0.546 0.241 264)',  // chart-1 — blue (primary)
  'oklch(0.68 0.20 40)',     // orange
  'oklch(0.62 0.19 162)',    // chart-2 — green
  'oklch(0.62 0.27 303)',    // chart-4 — purple
  'oklch(0.75 0.19 70)',     // chart-3 — amber
  'oklch(0.60 0.22 200)',    // teal
  'oklch(0.64 0.25 16)',     // chart-5 — red
  'oklch(0.55 0.24 280)',    // violet
  'oklch(0.65 0.18 120)',    // lime
  'oklch(0.58 0.23 340)',    // pink
  'oklch(0.50 0.12 240)',    // steel blue
  'oklch(0.70 0.15 95)',     // mustard
  'oklch(0.52 0.15 150)',    // forest
  'oklch(0.60 0.16 25)',     // terracotta
  'oklch(0.72 0.12 320)',    // lilac
  'oklch(0.46 0.10 190)',    // deep teal
]

// Semantic colors for known finance categories.
// Lookup is case-insensitive. Unknown categories fall back to paletteColor().
const CATEGORY_COLORS: Record<string, string> = {
  // Food & drink
  food:            'oklch(0.72 0.16 75)',
  groceries:       'oklch(0.66 0.17 135)',
  grocery:         'oklch(0.66 0.17 135)',
  supermarket:     'oklch(0.66 0.17 135)',
  restaurant:      'oklch(0.68 0.20 46)',
  dining:          'oklch(0.68 0.20 46)',
  cafe:            'oklch(0.65 0.14 58)',
  coffee:          'oklch(0.62 0.12 58)',
  bar:             'oklch(0.62 0.16 46)',
  drinks:          'oklch(0.62 0.16 46)',

  // Health & wellness
  health:          'oklch(0.64 0.14 192)',
  medical:         'oklch(0.64 0.14 192)',
  healthcare:      'oklch(0.64 0.14 192)',
  pharmacy:        'oklch(0.60 0.16 192)',
  dentist:         'oklch(0.60 0.14 192)',
  wellness:        'oklch(0.66 0.14 185)',

  // Sports & fitness
  sports:          'oklch(0.68 0.19 148)',
  fitness:         'oklch(0.68 0.19 148)',
  gym:             'oklch(0.68 0.19 148)',
  sport:           'oklch(0.68 0.19 148)',

  // Transport
  transport:       'oklch(0.55 0.18 248)',
  transportation:  'oklch(0.55 0.18 248)',
  travel:          'oklch(0.60 0.17 228)',
  fuel:            'oklch(0.52 0.16 248)',
  gas:             'oklch(0.52 0.16 248)',
  parking:         'oklch(0.55 0.10 248)',
  taxi:            'oklch(0.70 0.16 84)',
  uber:            'oklch(0.70 0.16 84)',

  // Housing & utilities
  rent:            'oklch(0.60 0.12 52)',
  housing:         'oklch(0.60 0.12 52)',
  mortgage:        'oklch(0.56 0.12 52)',
  utilities:       'oklch(0.52 0.09 240)',
  electricity:     'oklch(0.72 0.16 84)',
  water:           'oklch(0.58 0.14 220)',
  internet:        'oklch(0.55 0.15 248)',
  phone:           'oklch(0.55 0.15 248)',

  // Entertainment
  entertainment:   'oklch(0.62 0.23 300)',
  cinema:          'oklch(0.62 0.23 300)',
  movies:          'oklch(0.62 0.23 300)',
  gaming:          'oklch(0.58 0.25 285)',
  streaming:       'oklch(0.60 0.22 300)',
  music:           'oklch(0.64 0.20 310)',

  // Shopping & clothing
  shopping:        'oklch(0.64 0.20 350)',
  clothes:         'oklch(0.64 0.20 350)',
  clothing:        'oklch(0.64 0.20 350)',
  fashion:         'oklch(0.64 0.20 350)',
  electronics:     'oklch(0.52 0.16 248)',

  // Finance & tax
  tax:             'oklch(0.42 0.03 264)',
  taxes:           'oklch(0.42 0.03 264)',
  finance:         'oklch(0.546 0.241 264)',
  bank:            'oklch(0.546 0.241 264)',
  investment:      'oklch(0.50 0.20 264)',
  savings:         'oklch(0.62 0.19 162)',
  insurance:       'oklch(0.50 0.06 240)',
  fees:            'oklch(0.48 0.05 264)',

  // Income
  income:          'oklch(0.72 0.18 85)',
  salary:          'oklch(0.72 0.18 85)',
  freelance:       'oklch(0.70 0.18 85)',

  // Education
  education:       'oklch(0.55 0.20 268)',
  school:          'oklch(0.55 0.20 268)',
  books:           'oklch(0.58 0.16 268)',

  // Subscriptions & services
  subscription:    'oklch(0.62 0.22 280)',
  subscriptions:   'oklch(0.62 0.22 280)',
  services:        'oklch(0.58 0.12 240)',

  // Personal care
  beauty:          'oklch(0.68 0.18 340)',
  personal:        'oklch(0.65 0.16 340)',
  care:            'oklch(0.65 0.16 340)',

  // Gifts & family
  gifts:           'oklch(0.68 0.20 20)',
  family:          'oklch(0.65 0.14 30)',
  kids:            'oklch(0.72 0.18 60)',

  // Other
  other:           'oklch(0.52 0.04 264)',
  miscellaneous:   'oklch(0.52 0.04 264)',
  misc:            'oklch(0.52 0.04 264)',
}

/** FNV-1a 32-bit: a cheap hash whose low bits are well mixed (the old shift-add hash sent most names to the same slot). */
export function hashIndex(name: string, buckets = CHART_PALETTE.length): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash % buckets
}

export function paletteColor(name: string): string {
  return CHART_PALETTE[hashIndex(name)]
}

function semanticColor(name: string): string | undefined {
  return CATEGORY_COLORS[name.toLowerCase().trim()]
}

/** Semantic color for a finance category; falls back to hash-based palette. */
export function categoryColor(name: string): string {
  return semanticColor(name) ?? paletteColor(name)
}

/**
 * One color per name, no two names on the same palette color while the palette lasts.
 * Each name starts from its own `categoryColor` (so the result agrees with it whenever there
 * is no clash) and, on a clash, takes the next free palette color. Independent of the input
 * order (names are sorted first), so the same set always gets the same colors.
 */
export function distinctColors(names: Iterable<string>): Map<string, string> {
  const result = new Map<string, string>()
  const used = new Set<string>()
  const sorted = [...new Set(names)].sort()
  for (const name of sorted) {            // semantic colors first: they never move
    const color = semanticColor(name)
    if (color) { result.set(name, color); used.add(color) }
  }
  for (const name of sorted) {
    if (result.has(name)) continue
    const start = hashIndex(name)
    let color = CHART_PALETTE[start]
    for (let step = 0; step < CHART_PALETTE.length; step++) {
      const candidate = CHART_PALETTE[(start + step) % CHART_PALETTE.length]
      if (!used.has(candidate)) { color = candidate; break }
    }
    result.set(name, color)
    used.add(color)
  }
  return result
}

// Categorical series, in fixed order: the validated reference palette (light steps; the app has no dark theme switch).
// Plain hex on purpose: SVG fill attributes do not resolve CSS variables.
// A chart shows at most SERIES_MAX named slices; the rest folds into one neutral "other" slice.
export const SERIES_MAX = 7
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
export const OTHER_COLOR = '#9aa0ad'
export const SERIES_INK = '#4b5263'

export type Slice = {
  name: string
  amount: number
  percent: number
}

export function foldSlices<T extends Slice>(items: T[], otherLabel: string, max = SERIES_MAX): Slice[] {
  const sorted = [...items].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  if (sorted.length <= max + 1) return sorted
  const head = sorted.slice(0, max)
  const rest = sorted.slice(max)
  return [
    ...head,
    {
      name: otherLabel,
      amount: rest.reduce((s, x) => s + Math.abs(x.amount), 0),
      percent: rest.reduce((s, x) => s + Math.abs(x.percent), 0),
    },
  ]
}
