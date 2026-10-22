/**
 * Which project (workspace) the UI is working in, and the identity headers sent with every API call.
 *
 * Both live in localStorage. With no workspace selected the API uses the user's default project, so a
 * fresh install works without any setup. (Identity is a lightweight client-side id, not authentication.)
 */

import { getOrCreateUserId } from '@/lib/user-id'

const WORKSPACE_KEY = 'finance-assistant:workspace-id'
const LAST_ACCOUNT_KEY = 'finance-assistant:last-account'

export function getWorkspaceId(): number | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(WORKSPACE_KEY)
    const id = raw ? Number(raw) : NaN
    return Number.isInteger(id) && id > 0 ? id : undefined
  } catch {
    return undefined
  }
}

export function setWorkspaceId(id: number | undefined): void {
  if (typeof window === 'undefined') return
  try {
    if (id === undefined) window.localStorage.removeItem(WORKSPACE_KEY)
    else window.localStorage.setItem(WORKSPACE_KEY, String(id))
  } catch {
    // storage unavailable: fall back to the default project
  }
}

/** Headers that tell the API who is asking and for which project. Empty on the server. */
export function scopeHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const headers: Record<string, string> = { 'X-User-Id': getOrCreateUserId() }
  const workspaceId = getWorkspaceId()
  if (workspaceId !== undefined) headers['X-Workspace-Id'] = String(workspaceId)
  return headers
}

/** The account last used for an import in this project, to preselect it next time. */
export function getLastAccountId(): number | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(`${LAST_ACCOUNT_KEY}:${getWorkspaceId() ?? 'default'}`)
    return raw ? Number(raw) : undefined
  } catch {
    return undefined
  }
}

export function setLastAccountId(id: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`${LAST_ACCOUNT_KEY}:${getWorkspaceId() ?? 'default'}`, String(id))
  } catch {
    // not essential
  }
}
