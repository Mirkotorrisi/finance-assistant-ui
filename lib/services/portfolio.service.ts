/**
 * Portfolio at market value – maps to the backend /api/portfolio endpoints.
 */

import { get, post, put } from './http'
import type { Instrument, InstrumentUpdate, MarketPortfolio, RefreshReport, ResolveReport } from '@/lib/types/portfolio'

export const portfolioService = {
  /** GET /api/portfolio – positions valued at the last close, per broker, with the allocation by asset class */
  get(): Promise<MarketPortfolio> {
    return get<MarketPortfolio>('/api/portfolio')
  },

  /** GET /api/portfolio/instruments */
  instruments(): Promise<Instrument[]> {
    return get<Instrument[]>('/api/portfolio/instruments')
  },

  /** PUT /api/portfolio/instruments/:id */
  updateInstrument(id: number, data: InstrumentUpdate): Promise<Instrument> {
    return put<Instrument>(`/api/portfolio/instruments/${id}`, data)
  },

  /** POST /api/portfolio/resolve – OpenFIGI lookup of a price symbol for every ISIN without one */
  resolve(onlyMissing = true): Promise<ResolveReport> {
    return post<ResolveReport>(`/api/portfolio/resolve?only_missing=${onlyMissing}`, {})
  },

  /** POST /api/portfolio/refresh – today's closes, then the valuations (slow: calls are spaced out) */
  refresh(force = false): Promise<RefreshReport> {
    return post<RefreshReport>(`/api/portfolio/refresh?write=true&force=${force}`, {})
  },
}
