'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, History, Loader2, MessageSquare, Plus, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CHAT_HISTORY_UPDATED } from '@/lib/hooks/use-chat'
import { groupSessionsByDay, parseApiDate } from '@/lib/chat-history'
import { chatHistoryService } from '@/lib/services/chat-history.service'
import type { ChatSessionSummary } from '@/lib/types/chat'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface ChatHistoryProps {
  /** the conversation shown in the chat (highlighted) */
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  className?: string
}

function timeLabel(iso: string | null, locale: string): string {
  const d = parseApiDate(iso)
  if (!d) return ''
  const sameDay = new Date().toDateString() === d.toDateString()
  return sameDay
    ? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

/** The list of past conversations: new chat, search, grouped by day, delete with an inline confirm. */
export function ChatHistory({ activeId, onSelect, onNew, className }: ChatHistoryProps) {
  const { t, tr } = useTranslation()
  const [sessions, setSessions] = useState<ChatSessionSummary[] | null>(null)
  const [query, setQuery] = useState('')
  const [failed, setFailed] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const queryRef = useRef(query)
  queryRef.current = query

  const refresh = useCallback(async () => {
    try {
      setSessions(await chatHistoryService.list(queryRef.current))
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [])

  // first load, after every recorded turn, after a project switch
  useEffect(() => {
    void refresh()
    const events = [CHAT_HISTORY_UPDATED, 'workspace-changed']
    events.forEach((e) => window.addEventListener(e, refresh))
    return () => events.forEach((e) => window.removeEventListener(e, refresh))
  }, [refresh])

  // search as you type, lightly debounced
  useEffect(() => {
    const handle = setTimeout(() => void refresh(), 250)
    return () => clearTimeout(handle)
  }, [query, refresh])

  const remove = async (id: string) => {
    setBusy(id)
    try {
      await chatHistoryService.delete(id)
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null)
      window.dispatchEvent(new CustomEvent(CHAT_HISTORY_UPDATED, { detail: { sessionId: id, deleted: true } }))
      if (id === activeId) onNew()
    } catch {
      setFailed(true)
    } finally {
      setBusy(null)
      setConfirming(null)
    }
  }

  const groups = groupSessionsByDay(sessions ?? [])
  const labels: Record<string, string> = {
    today: t('chat.history.today'),
    yesterday: t('chat.history.yesterday'),
    thisWeek: t('chat.history.thisWeek'),
    older: t('chat.history.older'),
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex items-center gap-2 px-3 pt-3">
        <History className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <span className="text-sm font-semibold tracking-tight">{t('chat.history.title')}</span>
        <Button size="sm" variant="outline" className="ml-auto h-8 gap-1.5 px-2.5" onClick={onNew}>
          <Plus className="h-3.5 w-3.5" />
          {t('chat.history.newChat')}
        </Button>
      </div>
      <div className="relative px-3 pt-3">
        <Search className="pointer-events-none absolute left-5.5 top-1/2 mt-1.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('chat.history.search')}
          aria-label={t('chat.history.search')}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-3 py-3">
          {failed && <p className="px-1 text-xs text-destructive">{t('chat.history.loadError')}</p>}
          {sessions === null && !failed && (
            <div className="space-y-2 px-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="shimmer h-9 rounded-md bg-muted" />
              ))}
            </div>
          )}
          {sessions !== null && sessions.length === 0 && !failed && (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              {query ? t('chat.history.noMatch') : t('chat.history.empty')}
            </p>
          )}
          {groups.map((group) => (
            <div key={group.key}>
              <p className="eyebrow px-1 pb-1.5">{labels[group.key]}</p>
              <ul className="space-y-0.5">
                {group.sessions.map((s) => {
                  const active = s.id === activeId
                  const isConfirming = confirming === s.id
                  return (
                    <li key={s.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => onSelect(s.id)}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'flex w-full flex-col gap-0.5 rounded-md px-2 py-2 pr-9 text-left transition-colors',
                          active ? 'bg-sidebar-accent text-foreground' : 'text-foreground/85 hover:bg-sidebar-accent/70 hover:text-foreground',
                        )}
                      >
                        <span className="flex items-center gap-1.5 text-[13px] leading-tight">
                          <MessageSquare className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.75} />
                          <span className="truncate">{s.title || t('chat.history.untitled')}</span>
                        </span>
                        <span className="num pl-5 text-[11px] text-muted-foreground">
                          {timeLabel(s.updated_at, tr.summary.localeCode)} · {t('chat.history.messages', { n: s.message_count })}
                        </span>
                      </button>
                      {isConfirming ? (
                        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md bg-card p-0.5 shadow-card">
                          <button
                            type="button"
                            onClick={() => void remove(s.id)}
                            disabled={busy === s.id}
                            aria-label={t('chat.history.confirmDelete')}
                            className="press flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                          >
                            {busy === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            aria-label={t('common.cancel')}
                            className="press flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirming(s.id)}
                          aria-label={t('chat.history.delete')}
                          className="press absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
