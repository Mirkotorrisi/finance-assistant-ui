'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { TextareaField } from '@/components/advisor/fields'
import { useTranslation } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { profileService } from '@/lib/services/profile.service'
import { DECISION_STATUSES, type Decision, type DecisionStatus } from '@/lib/types/profile'

export function DecisionsList() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<DecisionStatus | ''>('')
  const [items, setItems] = useState<Decision[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    profileService
      .decisions(filter || undefined)
      .then((d) => {
        setItems(d)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('advisor.loadError')))
  }, [filter, t])

  useEffect(() => {
    load()
    const events = ['profile-updated', 'workspace-changed']
    events.forEach((e) => window.addEventListener(e, load))
    return () => events.forEach((e) => window.removeEventListener(e, load))
  }, [load])

  async function update(id: number, changes: { status?: DecisionStatus; outcome?: string }) {
    try {
      const saved = await profileService.updateDecision(id, changes)
      setItems((all) => all.map((d) => (d.id === id ? saved : d)))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('advisor.saveError'))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filter} onChange={(e) => setFilter(e.target.value as DecisionStatus | '')} className="w-48" aria-label={t('advisor.fields.status')}>
          <option value="">{t('advisor.decisions.filterAll')}</option>
          {DECISION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`advisor.options.decisionStatus.${s}`)}
            </option>
          ))}
        </Select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {items.length === 0 && <p className="text-sm text-muted-foreground">{t('advisor.decisions.empty')}</p>}
      {items.map((d) => (
        <Card key={d.id}>
          <CardContent className="space-y-3 pt-6 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(d.date)}
                  {d.profile_version !== null && <> · {t('advisor.decisions.profileVersion', { n: d.profile_version })}</>}
                </p>
              </div>
              <Select value={d.status} onChange={(e) => update(d.id, { status: e.target.value as DecisionStatus })} className="w-40" aria-label={t('advisor.fields.status')}>
                {DECISION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`advisor.options.decisionStatus.${s}`)}
                  </option>
                ))}
              </Select>
            </div>
            <p className="whitespace-pre-line text-muted-foreground">{d.rationale}</p>
            {d.data_refs.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium">{t('advisor.decisions.dataRefs')}</p>
                <div className="flex flex-wrap gap-1">
                  {d.data_refs.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {d.ips_refs.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium">{t('advisor.decisions.ipsRefs')}</p>
                <div className="flex flex-wrap gap-1">
                  {d.ips_refs.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <TextareaField label={t('advisor.decisions.outcome')} value={d.outcome ?? ''} onCommit={(v) => update(d.id, { outcome: v })} placeholder={t('advisor.decisions.outcomePlaceholder')} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
