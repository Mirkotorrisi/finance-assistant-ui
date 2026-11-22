/**
 * Chat history service – the conversations with the assistant (API /api/chat-sessions).
 * The gateway writes them as the turns run; the UI lists, reopens, renames and deletes them.
 */

import { del, get, patch } from './http'
import type { ChatSessionDetail, ChatSessionSummary } from '@/lib/types/chat'

export const chatHistoryService = {
  /** GET /api/chat-sessions – most recent first; `search` matches the title or any message text */
  list(search?: string, limit = 50): Promise<ChatSessionSummary[]> {
    return get<ChatSessionSummary[]>('/api/chat-sessions', { search: search?.trim() || undefined, limit })
  },

  /** GET /api/chat-sessions/{id} – the conversation with its messages */
  get(id: string): Promise<ChatSessionDetail> {
    return get<ChatSessionDetail>(`/api/chat-sessions/${encodeURIComponent(id)}`)
  },

  /** PATCH /api/chat-sessions/{id} */
  rename(id: string, title: string): Promise<ChatSessionSummary> {
    return patch<ChatSessionSummary>(`/api/chat-sessions/${encodeURIComponent(id)}`, { title })
  },

  /** DELETE /api/chat-sessions/{id} */
  delete(id: string): Promise<{ message: string }> {
    return del(`/api/chat-sessions/${encodeURIComponent(id)}`)
  },

  /** DELETE /api/chat-sessions – every conversation of the user in this project */
  clear(): Promise<{ deleted: number }> {
    return del<{ deleted: number }>('/api/chat-sessions')
  },
}
