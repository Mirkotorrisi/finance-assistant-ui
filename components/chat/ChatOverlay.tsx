'use client'

import { useEffect, useRef } from 'react'
import { ChatContainer } from './ChatContainer'
import { Button } from '@/components/ui/button'
import { MessageSquare, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { useChat } from '@/lib/hooks/use-chat'

interface ChatOverlayProps {
  open: boolean
  onClose: () => void
}

export function ChatOverlay({ open, onClose }: ChatOverlayProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, error, send } = useChat({ warm: open })

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
        inert={!open}
        role="complementary"
        aria-label={t('chat.overlay.ariaLabel')}
        className={cn(
          'fixed right-0 top-16 bottom-0 z-50 flex flex-col',
          'w-full sm:w-[380px]',
          'bg-background border-l border-border/60',
          'transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 h-12 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">{t('chat.overlay.title')}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={onClose}
            aria-label={t('chat.overlay.closeLabel')}
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
            onSubmit={send}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  )
}
