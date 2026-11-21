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
  /** a suggested prompt was chosen */
  onPrompt?: (message: string) => void
}

export function ChatMessageList({ messages, isLoading = false, onPrompt }: ChatMessageListProps) {
  const { t, tr } = useTranslation()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="px-4 py-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="enter flex min-h-[60vh] flex-col items-center justify-center gap-7 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-card">
              <Bot className="h-6 w-6 text-primary" strokeWidth={1.75} />
            </div>
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight">{t('chat.emptyTitle')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('chat.emptySubtitle')}
              </p>
            </div>
            <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              {tr.chat.suggestedPrompts.map((prompt, i) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onPrompt?.(prompt)}
                  disabled={!onPrompt}
                  className="lift enter flex items-center gap-2.5 rounded-xl border border-border/80 bg-card px-4 py-3 text-left text-sm text-foreground/80 shadow-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60"
                  style={{ '--i': i + 1 } as React.CSSProperties}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/70" />
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
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 rounded-full items-center justify-center bg-muted border border-border text-muted-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-border/80 bg-card px-4 py-3 shadow-card">
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
