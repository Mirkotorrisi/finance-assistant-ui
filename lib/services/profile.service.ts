/**
 * Client profile and advisor service – maps to /api/workspaces/current/profile and /api/advisor/*.
 */

import { get, patch, post, put } from './http'
import type {
  AdvisorReview,
  ClientProfile,
  Decision,
  DecisionCreate,
  DecisionStatus,
  DecisionUpdate,
  ProfileResponse,
  ProfileVersion,
} from '@/lib/types/profile'

export const profileService = {
  /** GET /api/workspaces/current/profile */
  get(): Promise<ProfileResponse> {
    return get<ProfileResponse>('/api/workspaces/current/profile')
  },

  /** PUT /api/workspaces/current/profile – replace the whole document */
  put(profile: ClientProfile, source: 'user' | 'agent' = 'user'): Promise<ProfileResponse> {
    return put<ProfileResponse>(`/api/workspaces/current/profile?source=${source}`, profile)
  },

  /** PATCH /api/workspaces/current/profile – partial update (nested merge, goals/debts upsert by key) */
  patch(doc: Record<string, unknown>, source: 'user' | 'agent' = 'user'): Promise<ProfileResponse> {
    return patch<ProfileResponse>('/api/workspaces/current/profile', { patch: doc, source })
  },

  /** GET /api/workspaces/current/profile/versions */
  versions(): Promise<ProfileVersion[]> {
    return get<{ versions: ProfileVersion[] }>('/api/workspaces/current/profile/versions').then((r) => r.versions)
  },

  /** POST /api/workspaces/current/profile/ips/approve – binds the approval to the current policy text */
  approveIps(): Promise<ProfileResponse> {
    return post<ProfileResponse>('/api/workspaces/current/profile/ips/approve', {})
  },

  /** GET /api/advisor/decisions */
  decisions(status?: DecisionStatus): Promise<Decision[]> {
    return get<Decision[]>('/api/advisor/decisions', status ? { status } : undefined)
  },

  /** POST /api/advisor/decisions */
  createDecision(body: DecisionCreate): Promise<Decision> {
    return post<Decision>('/api/advisor/decisions', body)
  },

  /** PUT /api/advisor/decisions/:id */
  updateDecision(id: number, body: DecisionUpdate): Promise<Decision> {
    return put<Decision>(`/api/advisor/decisions/${id}`, body)
  },

  /** GET /api/advisor/review */
  review(months = 12): Promise<AdvisorReview> {
    return get<AdvisorReview>('/api/advisor/review', { months })
  },
}
