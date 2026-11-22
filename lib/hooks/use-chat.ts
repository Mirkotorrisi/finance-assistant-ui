'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { streamChat, warmChatSession, type AgentEvent } from '@/lib/chat-stream'
import { storedToMessages } from '@/lib/chat-history'
import { chatHistoryService } from '@/lib/services/chat-history.service'
import { ApiError } from '@/lib/services/http'
import { getOrCreateUserId } from '@/lib/user-id'
import type { Message, MessagePart, TextPart, ToolCallPart, UiMetadataPart } from '@/lib/types/chat'

interface UseChatOptions {
  /** Pre-start the agent for this session (e.g. when the chat is opened). */
  warm?: boolean
  /** Open this stored conversation instead of starting a new one. */
  sessionId?: string
}

/** Fired on `window` when a turn has been recorded, so the history list can refresh. */
export const CHAT_HISTORY_UPDATED = 'chat-history-updated'

/** Streaming chat state shared by the chat page and the overlay. Conversations are persisted by the gateway. */
export function useChat({ warm = true, sessionId: initialSessionId }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(Boolean(initialSessionId))
  const [error, setError] = useState<Error | null>(null)
  const [sessionId, setSessionId] = useState<string>(() => initialSessionId ?? crypto.randomUUID())
  const userIdRef = useRef<string | undefined>(undefined)
  const sessionIdRef = useRef<string>(sessionId)
  const abortRef = useRef<AbortController | null>(null)
  if (!userIdRef.current) userIdRef.current = getOrCreateUserId()
  sessionIdRef.current = sessionId

  useEffect(() => {
    if (warm) void warmChatSession(userIdRef.current!, sessionId)
  }, [warm, sessionId])

  useEffect(() => () => abortRef.current?.abort(), [])

  // A stored conversation: show its messages (an unknown id is simply an empty, new one with that id)
  const load = useCallback((id: string) => {
    let cancelled = false
    setHistoryLoading(true)
    chatHistoryService
      .get(id)
      .then((detail) => {
        if (!cancelled && sessionIdRef.current === id) setMessages(storedToMessages(detail.messages))
      })
      .catch((err) => {
        if (cancelled || sessionIdRef.current !== id) return
        if (!(err instanceof ApiError && err.status === 404)) setError(err instanceof Error ? err : new Error('Failed to load the conversation'))
      })
      .finally(() => {
        if (!cancelled && sessionIdRef.current === id) setHistoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (initialSessionId) return load(initialSessionId)
  }, [initialSessionId, load])

  const newSession = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
    setError(null)
    setMessages([])
    setHistoryLoading(false)
    setSessionId(crypto.randomUUID())
  }, [])

  /** Show a stored conversation and continue it (the gateway replays its transcript to the agent). */
  const openSession = useCallback(
    (id: string) => {
      if (id === sessionIdRef.current) return
      abortRef.current?.abort()
      setIsLoading(false)
      setError(null)
      setMessages([])
      sessionIdRef.current = id
      setSessionId(id)
      load(id)
    },
    [load],
  )

  // The agent's tools are bound to a project: switching project starts a fresh conversation with the new one
  useEffect(() => {
    window.addEventListener('workspace-changed', newSession)
    return () => window.removeEventListener('workspace-changed', newSession)
  }, [newSession])

  const send = useCallback(async (userText: string) => {
    const currentSession = sessionIdRef.current
    setError(null)
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', text: userText } as TextPart],
        createdAt: new Date(),
      },
    ])
    setIsLoading(true)

    const assistantId = crypto.randomUUID()
    const toolCalls: string[] = []
    let text = ''
    let components: unknown[] = []
    let finished = false

    const publish = () => {
      const parts: MessagePart[] = [
        ...toolCalls.map(
          (toolName, i): ToolCallPart => ({ type: 'tool-call', toolCallId: `${assistantId}-${i}`, toolName, args: {} }),
        ),
      ]
      if (text) parts.push({ type: 'text', text } as TextPart)
      if (components.length) {
        parts.push({ type: 'ui-metadata', uiMetadata: { text: '', components } } as UiMetadataPart)
      }
      setMessages((prev) => {
        const message: Message = { id: assistantId, role: 'assistant', parts, createdAt: new Date() }
        const exists = prev.some((m) => m.id === assistantId)
        if (parts.length === 0) return prev
        return exists ? prev.map((m) => (m.id === assistantId ? message : m)) : [...prev, message]
      })
    }

    const onEvent = (event: AgentEvent) => {
      switch (event.type) {
        case 'status':
          toolCalls.push(event.tool)
          break
        case 'text_delta':
          text += event.text
          break
        case 'ui_component':
          components = [...components, event.component]
          break
        case 'done':
          finished = true
          toolCalls.length = 0
          text = event.text
          components = event.ui?.components ?? components
          break
        case 'error':
          finished = true
          toolCalls.length = 0
          setError(new Error(event.message))
          break
      }
      publish()
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat({
        message: userText,
        userId: userIdRef.current!,
        sessionId: currentSession,
        signal: controller.signal,
        onEvent,
      })
      if (!finished) throw new Error('The connection closed before the answer was complete.')
    } catch (err) {
      if (controller.signal.aborted) return
      toolCalls.length = 0
      publish()
      setError(err instanceof Error ? err : new Error('Failed to send message'))
    } finally {
      if (abortRef.current === controller) setIsLoading(false)
      // the gateway has recorded the turn by now (or was unreachable): let the history list refresh
      window.dispatchEvent(new CustomEvent(CHAT_HISTORY_UPDATED, { detail: { sessionId: currentSession } }))
    }
  }, [])

  return { messages, isLoading, historyLoading, error, send, sessionId, newSession, openSession }
}
