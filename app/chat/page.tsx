'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, History, Loader2, X } from 'lucide-react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { ChatHistory } from '@/components/chat/ChatHistory'
import { Button } from '@/components/ui/button'
import { useChat } from '@/lib/hooks/use-chat'
import { sessionIdFromSearch } from '@/lib/chat-history'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import Loading from './loading'

/** The chat with its history beside it. The open conversation is in the URL (`?session=`), so a reload keeps it. */
function ChatWorkbench({ sessionId }: { sessionId?: string }) {
  const { t } = useTranslation()
  const { messages, isLoading, historyLoading, error, send, sessionId: current, newSession, openSession } = useChat({ sessionId })
  const [drawer, setDrawer] = useState(false)

  // keep the URL on the conversation shown, without a navigation
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('session') === current) return
    url.searchParams.set('session', current)
    window.history.replaceState(window.history.state, '', url)
  }, [current])

  const open = (id: string) => {
    setDrawer(false)
    openSession(id)
  }

  const fresh = () => {
    setDrawer(false)
    newSession()
  }

  return (
    // the header is 4rem; below lg the horizontal nav adds another 3rem (+ its border)
    <div className="flex h-[calc(100dvh-7rem-1px)] lg:h-[calc(100vh-4rem)]">
      {/* one history panel: a column on desktop, a drawer below it */}
      <div
        aria-hidden="true"
        onClick={() => setDrawer(false)}
        className={cn(
          'fixed inset-0 top-16 z-40 bg-background/60 backdrop-blur-sm transition-opacity lg:hidden',
          drawer ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        aria-label={t('chat.history.title')}
        className={cn(
          'fixed bottom-0 left-0 top-16 z-50 w-80 max-w-[85vw] border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
          'lg:static lg:z-auto lg:w-72 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:bg-sidebar/60 lg:shadow-none lg:transition-none',
          drawer ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2.5 h-7 w-7 lg:hidden"
          onClick={() => setDrawer(false)}
          aria-label={t('chat.history.close')}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <ChatHistory activeId={current} onSelect={open} onNew={fresh} className="[&>div:first-child]:pr-10 lg:[&>div:first-child]:pr-3" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 px-4 pt-3 lg:hidden">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setDrawer(true)}>
            <History className="h-3.5 w-3.5" />
            {t('chat.history.open')}
          </Button>
        </div>
        {error && (
          <div className="mx-auto w-full max-w-3xl px-4 pt-3">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error.message}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {historyLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('chat.history.loading')}
            </div>
          ) : (
            <ChatContainer messages={messages} onSubmit={send} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  )
}

function ChatFromUrl() {
  // read once, on mount: the hook keeps the URL in step afterwards
  const params = useSearchParams()
  const [initial] = useState(() => sessionIdFromSearch(params.toString() ? `?${params.toString()}` : ''))
  return <ChatWorkbench sessionId={initial} />
}

export default function ChatPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatFromUrl />
    </Suspense>
  )
}
