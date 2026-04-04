/**
 * Transactions service – maps 1:1 to the backend /api/transactions endpoints.
 */

import { get, post, put, del } from './http'
import type {
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  BalanceResponse,
  TransactionFilters,
} from '@/lib/types/transaction'

export const transactionsService = {
  /** GET /api/transactions */
  list(filters?: TransactionFilters): Promise<Transaction[]> {
    return get<Transaction[]>('/api/transactions', filters as Record<string, string | number | boolean | undefined>)
  },

  /** POST /api/transactions */
  create(data: TransactionCreate): Promise<Transaction> {
    return post<Transaction>('/api/transactions', data)
  },

  /** POST /api/transactions/bulk */
  createBulk(data: TransactionCreate[]): Promise<Transaction[]> {
    return post<Transaction[]>('/api/transactions/bulk', data)
  },

  /** PUT /api/transactions/:id */
  update(id: number, data: TransactionUpdate): Promise<Transaction> {
    return put<Transaction>(`/api/transactions/${id}`, data)
  },

  /** DELETE /api/transactions/:id */
  delete(id: number): Promise<{ message: string }> {
    return del(`/api/transactions/${id}`)
  },

  /** GET /api/transactions/balance */
  getBalance(): Promise<BalanceResponse> {
    return get<BalanceResponse>('/api/transactions/balance')
  },
}
