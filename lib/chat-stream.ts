/**
 * Client for the gateway's streaming chat endpoint (server-sent events).
 * The same events are produced whichever agent backend (claude | openai) the gateway runs.
 */

import { getWorkspaceId } from '@/lib/workspace'

export const LLM_API_BASE_URL = process.env.NEXT_PUBLIC_LLM_API_BASE_URL ?? 'http://localhost:8000'

export interface AgentUiPlan {
  text: string
  components: unknown[]
}

export type AgentEvent =
  | { type: 'status'; tool: string }
  | { type: 'text_delta'; text: string }
  | { type: 'ui_component'; component: unknown }
  | { type: 'done'; text: string; ui: AgentUiPlan | null }
  | { type: 'error'; message: string }

interface StreamChatOptions {
  message: string
  userId: string
  sessionId: string
  signal?: AbortSignal
  onEvent: (event: AgentEvent) => void
}

/** Pre-starts the agent for a session so the first message skips the startup cost. Best effort. */
export async function warmChatSession(userId: string, sessionId: string): Promise<void> {
  try {
    await fetch(`${LLM_API_BASE_URL}/chat/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, session_id: sessionId, workspace_id: getWorkspaceId() }),
    })
  } catch {
    // warming is an optimisation only
  }
}

export async function streamChat({ message, userId, sessionId, signal, onEvent }: StreamChatOptions): Promise<void> {
  const res = await fetch(`${LLM_API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, user_id: userId, session_id: sessionId, workspace_id: getWorkspaceId() }),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`LLM service returned status ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const data = frame
        .split('\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => line.slice(6))
        .join('\n')
      if (data) onEvent(JSON.parse(data) as AgentEvent)
      boundary = buffer.indexOf('\n\n')
    }
  }
}
