"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import { Message } from "@/lib/types/chat"
import { Bot, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface ChatMessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatMessageList({ messages, isLoading = false }: ChatMessageListProps) {
  const { t, tr } = useTranslation()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="px-4 py-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-1">{t('chat.emptyTitle')}</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t('chat.emptySubtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {tr.chat.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground transition-all duration-150"
                  disabled
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={isLoading && message.id === messages[messages.length - 1]?.id}
          />
        ))}
        {isLoading && messages.length > 0 && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 rounded-full items-center justify-center bg-muted border border-border text-muted-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 shadow-xs">
              <div className="flex gap-1 items-center h-4">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
