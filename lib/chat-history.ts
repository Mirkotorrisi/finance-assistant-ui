/**
 * Pure helpers for the chat history: stored messages → chat messages, and sessions grouped by day.
 * Kept free of React so `npm test` covers them.
 */

import type { ChatSessionSummary, Message, MessagePart, StoredChatMessage } from '@/lib/types/chat'

/** The API stores naive UTC timestamps (no zone): read them as UTC, not as local time. */
export function parseApiDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const iso = /(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** A stored conversation as the chat renders it: text, then the components, then the error if the turn failed. */
export function storedToMessages(stored: StoredChatMessage[]): Message[] {
  const out: Message[] = []
  for (const m of stored) {
    const parts: MessagePart[] = []
    if (m.content) parts.push({ type: 'text', text: m.content })
    if (m.components?.length) parts.push({ type: 'ui-metadata', uiMetadata: { text: '', components: m.components } })
    if (m.error) parts.push({ type: 'tool-result', toolCallId: `${m.id}-error`, toolName: 'agent', result: m.error, isError: true })
    if (parts.length === 0) continue
    out.push({ id: `h-${m.id}`, role: m.role, parts, createdAt: parseApiDate(m.created_at) })
  }
  return out
}

export type SessionGroupKey = 'today' | 'yesterday' | 'thisWeek' | 'older'

export interface SessionGroup {
  key: SessionGroupKey
  sessions: ChatSessionSummary[]
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Sessions bucketed by when they were last active (local calendar days), keeping the API's order inside each. */
export function groupSessionsByDay(sessions: ChatSessionSummary[], now: Date = new Date()): SessionGroup[] {
  const today = startOfDay(now)
  const day = 24 * 60 * 60 * 1000
  const buckets: Record<SessionGroupKey, ChatSessionSummary[]> = { today: [], yesterday: [], thisWeek: [], older: [] }
  for (const s of sessions) {
    const when = parseApiDate(s.updated_at ?? s.created_at)
    const start = when ? startOfDay(when) : 0
    const age = (today - start) / day
    const key: SessionGroupKey = age < 1 ? 'today' : age < 2 ? 'yesterday' : age < 7 ? 'thisWeek' : 'older'
    buckets[key].push(s)
  }
  return (['today', 'yesterday', 'thisWeek', 'older'] as SessionGroupKey[])
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, sessions: buckets[k] }))
}

/** The id the page was opened on (`?session=`), if it is a plain token the gateway accepts. */
export function sessionIdFromSearch(search: string): string | undefined {
  const raw = new URLSearchParams(search).get('session')
  return raw && /^[A-Za-z0-9_.:-]{1,80}$/.test(raw) ? raw : undefined
}
