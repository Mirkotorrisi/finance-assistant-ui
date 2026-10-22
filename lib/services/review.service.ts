/**
 * Review service – maps to the backend /api/review endpoints (confirming the categories the AI suggested).
 */

import { get, post } from './http'
import type { Coverage, ReviewQueue } from '@/lib/types/review'

export const reviewService = {
  /** GET /api/review/queue */
  queue(limit = 100): Promise<ReviewQueue> {
    return get<ReviewQueue>('/api/review/queue', { limit })
  },

  /** POST /api/review/confirm – set a merchant's category on its unconfirmed transactions and remember it */
  confirm(merchantKey: string, category: string, createRule = true): Promise<{ transactions_updated: number; rule_created: boolean }> {
    return post('/api/review/confirm', { merchant_key: merchantKey, category, create_rule: createRule })
  },

  /** POST /api/review/accept – the suggestions are right */
  accept(merchantKey: string, createRule = false): Promise<{ transactions_accepted: number }> {
    return post('/api/review/accept', { merchant_key: merchantKey, create_rule: createRule })
  },

  /** GET /api/review/coverage */
  coverage(): Promise<Coverage> {
    return get<Coverage>('/api/review/coverage')
  },
}
