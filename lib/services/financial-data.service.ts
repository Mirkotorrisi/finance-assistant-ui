/**
 * Financial Data service – maps to the backend /api/financial-data endpoints.
 */

import { get } from './http'
import type { FinancialDataResponse } from '@/lib/types/financial-data'

export const financialDataService = {
  /** GET /api/financial-data/:year */
  getByYear(year: number): Promise<FinancialDataResponse> {
    return get<FinancialDataResponse>(`/api/financial-data/${year}`)
  },
}
