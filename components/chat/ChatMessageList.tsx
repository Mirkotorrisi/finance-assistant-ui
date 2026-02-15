"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import { Message } from "@/lib/types/chat"

interface ChatMessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatMessageList({ messages, isLoading = false }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <ScrollArea className="flex-1 h-full">
      <div ref={scrollRef} className="px-4 py-6 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-center">
              Start a conversation by typing a message below.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={isLoading && message.id === messages[messages.length - 1]?.id}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
