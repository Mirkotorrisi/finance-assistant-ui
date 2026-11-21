/** Mirrors GET /api/portfolio and /api/portfolio/instruments (finance-assistant-api/src/services/portfolio_service.py). */

export type AssetClass = 'equity' | 'bonds' | 'cash' | 'real_estate' | 'commodities' | 'crypto' | 'other'
export type InstrumentType = 'etf' | 'stock' | 'bond' | 'fund' | 'certificate' | 'other'
export type Valuation = 'market' | 'cost' | 'manual'
export type PriceBasis = 'market' | 'cost' | 'manual' | 'no_price' | 'no_quantity' | 'no_fx' | 'unknown'

export const ASSET_CLASSES: AssetClass[] = ['equity', 'bonds', 'cash', 'real_estate', 'commodities', 'crypto', 'other']
export const INSTRUMENT_TYPES: InstrumentType[] = ['etf', 'stock', 'bond', 'fund', 'certificate', 'other']
export const VALUATIONS: Valuation[] = ['market', 'cost', 'manual']

export interface ValuedPosition {
  key: string
  isin: string | null
  name: string
  status: 'open' | 'closed'
  trades: number
  invested: number
  proceeds: number
  dividends: number
  net_flow: number
  realized: number | null
  result: number | null
  quantity: number | null
  open_cost: number
  first_date: string
  last_date: string
  instrument_id: number | null
  asset_class: AssetClass
  type: InstrumentType
  symbol: string | null
  value: number | null
  unrealized: number | null
  price: number | null
  price_date: string | null
  price_currency: string | null
  fx: number | null
  price_basis: PriceBasis
  stale: boolean
}

export interface BrokerGroup {
  source_account_id: number | null
  source_account: string | null
  securities_account_id: number | null
  securities_account: string | null
  value: number
  open_cost: number
  unrealized: number
  unknown_positions: number
  positions: ValuedPosition[]
}

export interface AllocationSlice {
  asset_class: AssetClass
  value: number
  weight: number
}

export interface MarketPortfolio {
  as_of: string
  total_value: number
  allocation: AllocationSlice[]
  unknown_positions: number
  accounts: BrokerGroup[]
  note: string
}

export interface Instrument {
  id: number
  isin: string | null
  key: string
  name: string
  type: InstrumentType
  currency: string
  asset_class: AssetClass
  valuation: Valuation
  price_symbol: string | null
  price_source: string | null
  manual_price: number | null
  manual_price_date: string | null
  last_error: string | null
  last_price: { date: string; close: number; currency: string } | null
}

export interface InstrumentUpdate {
  name?: string
  type?: InstrumentType
  currency?: string
  asset_class?: AssetClass
  valuation?: Valuation
  price_symbol?: string
  manual_price?: number
  manual_price_date?: string
}

export interface ResolveReport {
  resolved: number
  unresolved: number
  instruments: { isin: string; name: string; symbol: string | null; valuation: Valuation; error: string | null }[]
  error?: string
}

export interface RefreshReport {
  prices: {
    requests: number
    updated: string[]
    errors?: { symbol: string; error: string }[]
    stopped?: string
    skipped?: string
  }
  valuations: {
    as_of: string
    written: { securities_account_id: number; value: number; unknown_positions: number }[]
    skipped: { source_account_id?: number; securities_account_id?: number; reason: string }[]
  } | null
}
