'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ChatContainer } from './ChatContainer'
import { Button } from '@/components/ui/button'
import { MessageSquare, X, AlertCircle } from 'lucide-react'
import { Message, TextPart } from '@/lib/types/chat'
import { cn } from '@/lib/utils'

const UI_METADATA_MARKER = '__UI_METADATA__:'
const LLM_API_BASE_URL = process.env.NEXT_PUBLIC_LLM_API_BASE_URL ?? 'http://localhost:8000'

interface ChatOverlayProps {
  open: boolean
  onClose: () => void
}

export function ChatOverlay({ open, onClose }: ChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Trap focus when open
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

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

      if (!res.ok) throw new Error(`LLM service returned status ${res.status}`)

      const data = await res.json()

      if (data.history) setHistory(data.history)

      let text = ''
      let uiMetadata: unknown = null

      if (typeof data.response === 'string') {
        text = data.response
      } else if (data.response && typeof data.response === 'object') {
        text = data.response.text ?? ''
        uiMetadata = data.response.ui ?? null
      }

      let assistantText = text
      if (uiMetadata) assistantText += `\n\n${UI_METADATA_MARKER}${JSON.stringify(uiMetadata)}`

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          parts: [{ type: 'text', text: assistantText } as TextPart],
          createdAt: new Date(),
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'))
    } finally {
      setIsLoading(false)
    }
  }, [history])

  return (
    <>
      {/* Backdrop — only on mobile where the panel is full-width */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 top-16 bg-background/60 backdrop-blur-sm z-40 sm:hidden transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="complementary"
        aria-label="AI chat"
        className={cn(
          'fixed right-0 top-16 bottom-0 z-50 flex flex-col',
          'w-full sm:w-[380px]',
          'bg-background border-l border-border/60 shadow-2xl',
          'transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 h-12 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">Ask AI</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive shrink-0">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error.message}
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatContainer
            messages={messages}
            onSubmit={handleMessageSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  )
}
