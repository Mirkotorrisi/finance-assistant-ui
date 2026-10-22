"use client"

import { ChatMessageList } from "./ChatMessageList"
import { ChatInput } from "./ChatInput"
import { Message } from "@/lib/types/chat"

interface ChatContainerProps {
  messages: Message[]
  onSubmit: (message: string) => void
  isLoading?: boolean
}

export function ChatContainer({ messages, onSubmit, isLoading = false }: ChatContainerProps) {
  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList messages={messages} isLoading={isLoading} />
      </div>
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <ChatInput onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}
