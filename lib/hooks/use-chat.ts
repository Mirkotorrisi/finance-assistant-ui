'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { streamChat, warmChatSession, type AgentEvent } from '@/lib/chat-stream'
import { getOrCreateUserId } from '@/lib/user-id'
import type { Message, MessagePart, TextPart, ToolCallPart, UiMetadataPart } from '@/lib/types/chat'

interface UseChatOptions {
  /** Pre-start the agent for this session (e.g. when the chat is opened). */
  warm?: boolean
}

/** Streaming chat state shared by the chat page and the overlay. */
export function useChat({ warm = true }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const userIdRef = useRef<string | undefined>(undefined)
  const sessionIdRef = useRef<string | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)
  if (!userIdRef.current) userIdRef.current = getOrCreateUserId()
  if (!sessionIdRef.current) sessionIdRef.current = crypto.randomUUID()

  useEffect(() => {
    if (warm) void warmChatSession(userIdRef.current!, sessionIdRef.current!)
  }, [warm])

  useEffect(() => () => abortRef.current?.abort(), [])

  // The agent's tools are bound to a project: switching project starts a fresh conversation with the new one
  useEffect(() => {
    function onWorkspaceChanged() {
      sessionIdRef.current = crypto.randomUUID()
      if (warm) void warmChatSession(userIdRef.current!, sessionIdRef.current)
    }
    window.addEventListener('workspace-changed', onWorkspaceChanged)
    return () => window.removeEventListener('workspace-changed', onWorkspaceChanged)
  }, [warm])

  const send = useCallback(async (userText: string) => {
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
        sessionId: sessionIdRef.current!,
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
    }
  }, [])

  return { messages, isLoading, error, send }
}
