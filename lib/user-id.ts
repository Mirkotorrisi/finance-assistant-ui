/**
 * Lightweight client-side user identity — no auth system yet.
 * A UUID is generated once per browser and persisted in localStorage,
 * then sent as user_id to the LLM chat endpoints so the backend can
 * key onboarding preferences per user.
 */

const STORAGE_KEY = 'finance-assistant:user-id'

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'anonymous'

  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const userId = crypto.randomUUID()
  window.localStorage.setItem(STORAGE_KEY, userId)
  return userId
}
