"use client"

import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { Message, MessagePart } from "@/lib/types/chat"
import { useMemo } from "react"

export default function ChatPage() {
  const transport = useMemo(
    () => new TextStreamChatTransport({
      api: '/api/ai/chat',
    }),
    []
  )

  const { messages, sendMessage, status, error } = useChat({
    transport,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Convert useChat messages to our Message type with parts
  const chatMessages: Message[] = messages.map((msg) => {
    return {
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      // Cast parts to our MessagePart type - the AI SDK may have additional part types
      parts: msg.parts as MessagePart[],
      createdAt: new Date(),
    }
  })

  const handleMessageSubmit = (message: string) => {
    sendMessage({
      text: message,
    })
  }

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
        messages={chatMessages}
        onSubmit={handleMessageSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
