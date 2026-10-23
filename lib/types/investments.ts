/** Mirrors GET /api/investments (finance-assistant-api/src/services/investments.py). */

export interface InvestmentPosition {
  key: string
  isin: string | null
  name: string
  status: 'open' | 'closed'
  trades: number
  invested: number
  proceeds: number
  dividends: number
  /** proceeds + dividends - invested: the cash view, not a gain while the position is open */
  net_flow: number
  /** gain/loss on what was sold (average cost); null when a sale has no quantity to price it */
  realized: number | null
  /** realized + dividends; null when realized is unknown */
  result: number | null
  quantity: number | null
  /** cost of what is still held */
  open_cost: number
  first_date: string
  last_date: string
}

export interface InvestmentTotals {
  invested: number
  proceeds: number
  dividends: number
  net_invested: number
  cost_basis_open: number
  realized: number
  realized_result: number
  unresolved_instruments: number
  unresolved_net_flow: number
  trades: number
}

export interface InvestmentMonth {
  month: string
  invested: number
  returned: number
}

export interface Portfolio {
  totals: InvestmentTotals
  positions: InvestmentPosition[]
  by_month: InvestmentMonth[]
  note: string
}
