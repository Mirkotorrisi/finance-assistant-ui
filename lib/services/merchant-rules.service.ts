import { post } from './http'

interface RecategorizeResult {
  rule: { id: number; pattern: string; category: string }
  transactions_updated: number
}

export const merchantRulesService = {
  /** POST /api/merchant-rules/recategorize — saves rule and bulk-updates matching transactions */
  recategorize(pattern: string, category: string): Promise<RecategorizeResult> {
    return post<RecategorizeResult>('/api/merchant-rules/recategorize', { pattern, category })
  },
}
