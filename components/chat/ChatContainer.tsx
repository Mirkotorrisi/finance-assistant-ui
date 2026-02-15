"use client"

import { Card } from "@/components/ui/card"
import { ChatMessageList } from "./ChatMessageList"
import { ChatInput } from "./ChatInput"
import { ChatMessage } from "@/lib/types/chat"

interface ChatContainerProps {
  messages: ChatMessage[]
  onSubmit: (message: string) => void
  isLoading?: boolean
}

export function ChatContainer({ messages, onSubmit, isLoading = false }: ChatContainerProps) {
  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList messages={messages} isLoading={isLoading} />
      </div>
      <ChatInput onSubmit={onSubmit} isLoading={isLoading} />
    </Card>
  )
}
