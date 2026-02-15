"use client"

import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { ChatMessage } from "@/lib/types/chat"
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

  // Convert useChat messages to our ChatMessage type
  const chatMessages: ChatMessage[] = messages.map((msg) => {
    // Extract text content from parts
    const textParts = msg.parts.filter(part => part.type === 'text')
    const content = textParts.map(part => (part as { type: 'text'; text: string }).text).join('')
    
    return {
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content,
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
