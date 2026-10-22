'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import { reviewService } from '@/lib/services/review.service'
import { workspacesService } from '@/lib/services/workspaces.service'
import type { Blueprint, BlueprintCategory } from '@/lib/types/blueprint'
import type { ReviewGroup, ReviewQueue as Queue } from '@/lib/types/review'

const SURE = 0.9

interface Leaf {
  key: string
  path: string
}

function leaves(nodes: BlueprintCategory[] = [], trail: string[] = []): Leaf[] {
  return nodes.flatMap((n) => {
    const here = [...trail, n.label]
    return n.children && n.children.length > 0 ? leaves(n.children, here) : [{ key: n.key, path: here.join(' › ') }]
  })
}

function confidenceTone(confidence: number | null): string {
  if (confidence === null) return 'bg-muted text-muted-foreground'
  if (confidence >= SURE) return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
  if (confidence >= 0.6) return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
  return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
}

function Row({
  group, options, onDone,
}: {
  group: ReviewGroup
  options: Leaf[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const initial = group.suggestion.key ?? ''
  const [choice, setChoice] = useState(initial)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    if (!choice) return
    setBusy(true)
    setError(null)
    try {
      await reviewService.confirm(group.merchant_key, choice, remember)
      window.dispatchEvent(new Event('review-updated'))
      window.dispatchEvent(new Event('transactions-updated'))
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const confidence = group.suggestion.confidence
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{group.descriptions[0]}</p>
            <p className="text-xs text-muted-foreground">
              {group.merchant_key}
              {group.descriptions.length > 1 && ` · ${group.descriptions.slice(1).join(' · ')}`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(-group.total_amount, 'EUR')}</p>
            <p className="text-xs text-muted-foreground">{t('review.transactions', { n: group.transactions })}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="h-9 w-64"
            aria-label={`${group.merchant_key} ${t('review.category')}`}
          >
            <option value="" disabled>
              {t('review.chooseCategory')}
            </option>
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.path}
              </option>
            ))}
          </Select>
          {group.suggestion.source === 'ai' || group.suggestion.source === 'fallback' ? (
            <Badge className={`${confidenceTone(confidence)} gap-1`} variant="secondary">
              <Sparkles className="h-3 w-3" />
              {confidence !== null ? `${Math.round(confidence * 100)}%` : t('review.suggested')}
            </Badge>
          ) : (
            <Badge variant="outline">{t(`review.source.${group.suggestion.source}`) || group.suggestion.source}</Badge>
          )}
          {group.mixed && <Badge variant="outline">{t('review.mixed')}</Badge>}
          {!group.suggestion.key && <Badge variant="outline">{t('review.unmapped', { name: group.suggestion.category })}</Badge>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            {t('review.remember')}
          </label>
          <Button size="sm" disabled={busy || !choice} onClick={confirm}>
            {t('review.confirm')}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}

export function ReviewQueue() {
  const { t } = useTranslation()
  const [queue, setQueue] = useState<Queue | null>(null)
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const load = useCallback(() => {
    Promise.all([reviewService.queue(), workspacesService.current().then((w) => workspacesService.getBlueprint(w.id))])
      .then(([q, b]) => {
        setQueue(q)
        setBlueprint(b.blueprint)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('workspace-changed', load)
    window.addEventListener('transactions-updated', load)
    return () => {
      window.removeEventListener('workspace-changed', load)
      window.removeEventListener('transactions-updated', load)
    }
  }, [load])

  const options = useMemo(() => leaves(blueprint?.categories), [blueprint])
  const sure = useMemo(
    () => (queue?.groups ?? []).filter((g) => g.suggestion.key && !g.mixed && (g.suggestion.confidence ?? 0) >= SURE && g.suggestion.source === 'ai'),
    [queue],
  )

  async function confirmSure() {
    setBulkBusy(true)
    try {
      for (const g of sure) await reviewService.confirm(g.merchant_key, g.suggestion.key!, true)
      window.dispatchEvent(new Event('review-updated'))
      window.dispatchEvent(new Event('transactions-updated'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBulkBusy(false)
      load()
    }
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!queue) return <p className="text-sm text-muted-foreground">…</p>

  const share = Math.round(queue.coverage.reviewed_share * 100)
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-2 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{t('review.coverageTitle', { n: share })}</p>
            <p className="text-sm text-muted-foreground">
              {t('review.coverageDetail', {
                confirmed: formatCurrency(-queue.coverage.reviewed_amount, 'EUR'),
                pending: formatCurrency(-queue.coverage.unreviewed_amount, 'EUR'),
              })}
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={share} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${share}%` }} />
          </div>
        </CardContent>
      </Card>

      {queue.groups.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {t('review.allDone')}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t('review.intro', { groups: queue.total_groups, n: queue.unreviewed_transactions })}</p>
            {sure.length > 1 && (
              <Button variant="outline" size="sm" disabled={bulkBusy} onClick={confirmSure}>
                {t('review.confirmSure', { n: sure.length })}
              </Button>
            )}
          </div>
          {queue.groups.map((g) => (
            <Row key={g.merchant_key} group={g} options={options} onDone={load} />
          ))}
        </>
      )}
    </div>
  )
}
