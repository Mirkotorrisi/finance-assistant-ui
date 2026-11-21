'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DateField, NumberField, SelectField, TextField, TextareaField } from '@/components/advisor/fields'
import { useTranslation } from '@/lib/i18n'
import { uniqueKey } from '@/lib/profile-edit'
import { GOAL_STATUSES, type Goal } from '@/lib/types/profile'

interface Props {
  goals: Goal[]
  onPatch: (doc: Record<string, unknown>) => Promise<void>
}

export function GoalsEditor({ goals, onPatch }: Props) {
  const { t } = useTranslation()
  const [label, setLabel] = useState('')
  const [showDropped, setShowDropped] = useState(false)
  const visible = goals.filter((g) => showDropped || g.status !== 'dropped')
  const dropped = goals.length - goals.filter((g) => g.status !== 'dropped').length

  // goals are upserted by key on the API side: one goal per patch is enough
  const upsert = (goal: Partial<Goal> & { key: string }) => onPatch({ goals: [goal] })

  const add = () => {
    const text = label.trim()
    if (!text) return
    setLabel('')
    void upsert({ key: uniqueKey(text, goals), label: text, status: 'active', priority: 3 })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={t('advisor.newGoalPlaceholder')}
          aria-label={t('advisor.addGoal')}
          className="h-9"
        />
        <Button type="button" size="sm" onClick={add} disabled={!label.trim()} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t('advisor.addGoal')}
        </Button>
      </div>
      {goals.length === 0 && <p className="text-sm text-muted-foreground">{t('advisor.noGoals')}</p>}
      {visible
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map((g) => (
          <Card key={g.key} className={g.status === 'dropped' ? 'opacity-60' : ''}>
            <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <TextField label={t('advisor.fields.label')} value={g.label} onCommit={(v) => upsert({ key: g.key, label: v })} allowEmpty={false} />
              </div>
              <SelectField
                label={t('advisor.fields.status')}
                value={g.status}
                options={GOAL_STATUSES}
                optionLabel={(v) => t(`advisor.options.goalStatus.${v}`)}
                onCommit={(v) => upsert({ key: g.key, status: v })}
              />
              <NumberField label={t('advisor.fields.amount')} value={g.amount} onCommit={(v) => upsert({ key: g.key, amount: v })} min={0} />
              <DateField label={t('advisor.fields.targetDate')} value={g.target_date} onCommit={(v) => upsert({ key: g.key, target_date: v })} />
              <NumberField label={t('advisor.fields.horizonYears')} value={g.horizon_years} onCommit={(v) => upsert({ key: g.key, horizon_years: v })} min={0} max={80} />
              <NumberField label={t('advisor.fields.priority')} value={g.priority} onCommit={(v) => upsert({ key: g.key, priority: v ?? 3 })} min={1} max={5} nullable={false} />
              <div className="sm:col-span-2">
                <TextareaField label={t('advisor.fields.notes')} value={g.notes} onCommit={(v) => upsert({ key: g.key, notes: v })} />
              </div>
              <div className="flex items-center justify-between sm:col-span-3">
                <Badge variant="outline" className="text-xs">
                  {g.key}
                </Badge>
                {g.status !== 'dropped' && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => upsert({ key: g.key, status: 'dropped' })} className="gap-1.5 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('advisor.remove')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      {dropped > 0 && (
        <Button type="button" variant="link" size="sm" onClick={() => setShowDropped((v) => !v)}>
          {t('advisor.showDropped')} ({dropped})
        </Button>
      )}
    </div>
  )
}
