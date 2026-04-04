/**
 * Accounts service – maps 1:1 to the backend /api/accounts endpoints.
 */

import { get, post, put, del } from './http'
import type {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountBalanceResponse,
} from '@/lib/types/account'

export const accountsService = {
  /** GET /api/accounts */
  list(activeOnly = true): Promise<Account[]> {
    return get<Account[]>('/api/accounts', { active_only: activeOnly })
  },

  /** GET /api/accounts/:id */
  getById(id: number): Promise<Account> {
    return get<Account>(`/api/accounts/${id}`)
  },

  /** POST /api/accounts */
  create(data: AccountCreate): Promise<Account> {
    return post<Account>('/api/accounts', data)
  },

  /** PUT /api/accounts/:id */
  update(id: number, data: AccountUpdate): Promise<Account> {
    return put<Account>(`/api/accounts/${id}`, data)
  },

  /** DELETE /api/accounts/:id */
  delete(id: number): Promise<{ message: string }> {
    return del(`/api/accounts/${id}`)
  },

  /** GET /api/accounts/:id/balance */
  getBalance(id: number): Promise<AccountBalanceResponse> {
    return get<AccountBalanceResponse>(`/api/accounts/${id}/balance`)
  },
}
