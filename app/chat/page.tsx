"use client"

import { ChatContainer } from "@/components/chat/ChatContainer"
import { AlertCircle } from "lucide-react"
import { useChat } from "@/lib/hooks/use-chat"

export default function ChatPage() {
  const { messages, isLoading, error, send } = useChat()

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
          onSubmit={send}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
