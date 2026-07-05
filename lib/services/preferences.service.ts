/**
 * Preferences service – maps 1:1 to the backend /api/preferences endpoints.
 * Onboarding context (focus/custom categories, budget target) is per-user,
 * keyed by the client-generated user_id (see lib/user-id.ts).
 */

import { get, post, put } from './http'

export interface UserPreferences {
  user_id: string
  onboarding_completed: boolean
  focus_categories: string[]
  custom_categories: string[]
  budget_amount: number | null
  budget_period: string
  notes: string | null
}

export interface UserPreferencesUpdate {
  focus_categories?: string[]
  custom_categories?: string[]
  budget_amount?: number | null
  budget_period?: string
  notes?: string | null
}

export const preferencesService = {
  /** GET /api/preferences/:userId */
  get(userId: string): Promise<UserPreferences> {
    return get<UserPreferences>(`/api/preferences/${userId}`)
  },

  /** PUT /api/preferences/:userId */
  update(userId: string, data: UserPreferencesUpdate): Promise<UserPreferences> {
    return put<UserPreferences>(`/api/preferences/${userId}`, data)
  },

  /** POST /api/preferences/:userId/confirm */
  confirm(userId: string): Promise<UserPreferences> {
    return post<UserPreferences>(`/api/preferences/${userId}/confirm`, {})
  },
}
