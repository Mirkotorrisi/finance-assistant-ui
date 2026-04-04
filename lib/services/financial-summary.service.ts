/**
 * Financial Summary service – maps to the backend /api/financial-summary endpoints.
 */

import { get } from './http'
import type {
  MonthlySummary,
  SpendingDistribution,
  AccountBreakdown,
  SpendingDistributionParams,
} from '@/lib/types/financial-summary'

export const financialSummaryService = {
  /** GET /api/financial-summary/monthly/:month  (month format: YYYY-MM) */
  getMonthly(month: string): Promise<MonthlySummary> {
    return get<MonthlySummary>(`/api/financial-summary/monthly/${month}`)
  },

  /** GET /api/financial-summary/spending-distribution */
  getSpendingDistribution(params: SpendingDistributionParams): Promise<SpendingDistribution> {
    return get<SpendingDistribution>('/api/financial-summary/spending-distribution', {
      start_date: params.start_date,
      end_date: params.end_date,
      group_by: params.group_by ?? 'category',
    })
  },

  /** GET /api/financial-summary/account-breakdown */
  getAccountBreakdown(): Promise<AccountBreakdown> {
    return get<AccountBreakdown>('/api/financial-summary/account-breakdown')
  },
}
