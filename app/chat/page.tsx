"use client"

import { useState, useCallback } from "react"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { Message, TextPart } from "@/lib/types/chat"

// Must stay in sync with the marker used in components/chat/ChatContainer.tsx
const UI_METADATA_MARKER = '__UI_METADATA__:'

interface LlmResponse {
  text?: string
  ui?: unknown
}

interface ChatApiResponse {
  response: LlmResponse | string
}

const LLM_API_BASE_URL = process.env.NEXT_PUBLIC_LLM_API_BASE_URL ?? 'http://localhost:8000'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

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
        body: JSON.stringify({ message: userText }),
      })

      if (!res.ok) {
        throw new Error(`LLM service returned status ${res.status}`)
      }

      const data: ChatApiResponse = await res.json()

      // Extract text and optional UI metadata from the backend response
      let text = ''
      let uiMetadata: unknown = null

      if (typeof data.response === 'string') {
        text = data.response
      } else if (data.response && typeof data.response === 'object') {
        text = data.response.text ?? ''
        uiMetadata = data.response.ui ?? null
      }

      // Embed UI metadata with the marker so ChatContainer can parse it
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
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Financial Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Ask questions about your finances, get insights, and receive personalized advice.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error.message}</p>
        </div>
      )}

      <ChatContainer
        messages={messages}
        onSubmit={handleMessageSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
