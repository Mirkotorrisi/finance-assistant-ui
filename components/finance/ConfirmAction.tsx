'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { confirmAgentAction } from '@/lib/chat-stream'
import { useTranslation } from '@/lib/i18n'
import { argRows } from '@/lib/confirm-args'

/**
 * A destructive action the agent proposed but cannot run: deleting, undoing an import, sweeping recategorisations.
 * The gateway holds it until the user clicks here (`POST /chat/confirm`); the agent itself never executes it.
 */
interface ConfirmActionProps {
  title?: string
  params?: {
    confirmationId: string
    tool: string
    args: Record<string, unknown>
  }
}

type State = 'idle' | 'loading' | 'done' | 'cancelled' | 'error'

/** Events the rest of the app listens to, by the data a tool changes. */
const REFRESH_EVENTS: Record<string, string[]> = {
  delete_transaction: ['transactions-updated'],
  bulk_update_categories: ['transactions-updated', 'review-updated'],
  recategorize_by_pattern: ['transactions-updated', 'review-updated'],
  remap_category: ['transactions-updated', 'review-updated'],
  accept_suggestions: ['transactions-updated', 'review-updated'],
  undo_import: ['transactions-updated'],
  adjust_balance_snapshot: ['transactions-updated'],
  resolve_suspect_duplicate: ['transactions-updated'],
  resolve_suspect_duplicates_bulk: ['transactions-updated'],
}

export function ConfirmAction({ title, params }: ConfirmActionProps) {
  const { t, tr } = useTranslation()
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!params?.confirmationId || !params.tool) return null

  const toolLabels = tr.confirmAction.tools as Record<string, string>
  const label = toolLabels[params.tool] ?? params.tool
  const rows = argRows(params.args, {
    items: (n) => t('confirmAction.items', { n }),
    movements: (n) => t('confirmAction.movements', { n }),
  })

  async function act(approve: boolean) {
    setState('loading')
    setErrorMsg('')
    try {
      const res = await confirmAgentAction(params!.confirmationId, approve)
      if (res.status === 'done') {
        setState('done')
        for (const name of REFRESH_EVENTS[params!.tool] ?? ['transactions-updated']) {
          window.dispatchEvent(new Event(name))
        }
      } else {
        setState('cancelled')
      }
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : t('confirmAction.error'))
    }
  }

  if (state === 'done') {
    return (
      <Card className="border-positive/25 bg-positive/10">
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle className="h-5 w-5 text-positive shrink-0" />
          <p className="text-sm font-medium text-positive">{t('confirmAction.done', { action: label })}</p>
        </CardContent>
      </Card>
    )
  }
  if (state === 'cancelled') {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">{t('confirmAction.cancelled', { action: label })}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-warning/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          {title || t('confirmAction.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('confirmAction.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{label}</Badge>
          <span className="font-mono text-[11px] text-muted-foreground">{params.tool}</span>
        </div>
        {rows.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {rows.map((row) => (
              <div key={row.key} className="contents">
                <dt className="font-mono text-xs text-muted-foreground">{row.key}</dt>
                <dd className="min-w-0">
                  {row.items ? (
                    <details className="group">
                      <summary className="cursor-pointer select-none truncate marker:text-muted-foreground" title={row.summary}>
                        {row.summary}
                      </summary>
                      <ul className="mt-1 max-h-48 space-y-0.5 overflow-y-auto rounded-md border border-border/60 bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
                        {row.items.map((line, i) => (
                          <li key={i} className="truncate" title={line}>{line}</li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <span className="block truncate" title={row.summary}>{row.summary}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className="flex flex-col gap-2 pt-1">
          {state === 'error' && (
            <p className="text-xs text-destructive">
              {errorMsg || t('confirmAction.error')} {t('confirmAction.retryHint')}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => act(false)} disabled={state === 'loading'}>
              {t('confirmAction.cancel')}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => act(true)} disabled={state === 'loading'}>
              {state === 'loading' ? t('confirmAction.running') : t('confirmAction.confirm')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
