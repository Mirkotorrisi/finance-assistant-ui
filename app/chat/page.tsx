"use client"

import { useState, useCallback } from "react"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { Message, TextPart } from "@/lib/types/chat"
import { AlertCircle } from "lucide-react"

const UI_METADATA_MARKER = '__UI_METADATA__:'

interface LlmResponse {
  text?: string
  ui?: unknown
}

interface ChatApiResponse {
  response: LlmResponse | string
  history?: string[]
}

const LLM_API_BASE_URL = process.env.NEXT_PUBLIC_LLM_API_BASE_URL ?? 'http://localhost:8000'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [history, setHistory] = useState<string[]>([])

  const handleMessageSubmit = useCallback(async (userText: string) => {
    setError(null)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: userText } as TextPart],
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch(`${LLM_API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history }),
      })

      if (!res.ok) {
        throw new Error(`LLM service returned status ${res.status}`)
      }

      const data: ChatApiResponse = await res.json()

      if (data.history) {
        setHistory(data.history)
      }

      let text = ''
      let uiMetadata: unknown = null

      if (typeof data.response === 'string') {
        text = data.response
      } else if (data.response && typeof data.response === 'object') {
        text = data.response.text ?? ''
        uiMetadata = data.response.ui ?? null
      }

      let assistantText = text
      if (uiMetadata) {
        assistantText += `\n\n${UI_METADATA_MARKER}${JSON.stringify(uiMetadata)}`
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ type: 'text', text: assistantText } as TextPart],
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'))
    } finally {
      setIsLoading(false)
    }
  }, [history])

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4 pt-3">
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error.message}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          messages={messages}
          onSubmit={handleMessageSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
