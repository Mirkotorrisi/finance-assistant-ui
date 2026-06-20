export const CHART_PALETTE = [
  'oklch(0.546 0.241 264)',  // chart-1 — blue (primary)
  'oklch(0.62 0.19 162)',    // chart-2 — green
  'oklch(0.75 0.19 70)',     // chart-3 — amber
  'oklch(0.62 0.27 303)',    // chart-4 — purple
  'oklch(0.64 0.25 16)',     // chart-5 — red
  'oklch(0.60 0.22 200)',    // teal
  'oklch(0.58 0.23 340)',    // pink
  'oklch(0.65 0.18 120)',    // lime
  'oklch(0.55 0.24 280)',    // violet
  'oklch(0.68 0.20 40)',     // orange
]

export function paletteColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CHART_PALETTE[Math.abs(hash) % CHART_PALETTE.length]
}
