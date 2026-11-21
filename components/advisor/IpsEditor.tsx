'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AllocationBars } from '@/components/advisor/AllocationBars'
import { IpsStatusBadge } from '@/components/advisor/IpsStatusBadge'
import { NumberField, SelectField, TextareaField } from '@/components/advisor/fields'
import { useTranslation } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { allocationCheck, patchAt } from '@/lib/profile-edit'
import { ASSET_CLASSES, REVIEW_CADENCES, type AllocationTarget, type InvestmentPolicy, type IpsStatus } from '@/lib/types/profile'

interface Props {
  ips: InvestmentPolicy
  status: IpsStatus
  approvedAt: string | null
  onPatch: (doc: Record<string, unknown>) => Promise<void>
  onApprove: () => Promise<void>
}

export function IpsEditor({ ips, status, approvedAt, onPatch, onApprove }: Props) {
  const { t } = useTranslation()
  const [approving, setApproving] = useState(false)
  const [constraint, setConstraint] = useState('')
  // the allocation is edited locally and sent whole once the weights add up (the API refuses anything else)
  const [draft, setDraft] = useState<AllocationTarget[] | null>(null)
  const targets = draft ?? ips.target_allocation
  const check = allocationCheck(targets)
  const set = (field: keyof InvestmentPolicy, value: unknown) => onPatch(patchAt(`ips.${field}`, value))

  const commitAllocation = (next: AllocationTarget[]) => {
    if (allocationCheck(next).ok) {
      setDraft(null)
      void onPatch({ ips: { target_allocation: next } })
    } else {
      setDraft(next)
    }
  }
  const updateTarget = (i: number, changes: Partial<AllocationTarget>) =>
    commitAllocation(targets.map((a, j) => (j === i ? { ...a, ...changes } : a)))
  const removeTarget = (i: number) => commitAllocation(targets.filter((_, j) => j !== i))
  const addTarget = () => {
    const free = ASSET_CLASSES.find((c) => !targets.some((a) => a.asset_class === c))
    if (!free) return
    commitAllocation([...targets, { asset_class: free, weight: 0, band: 5, notes: '' }])
  }

  const addConstraint = () => {
    const text = constraint.trim()
    if (!text) return
    setConstraint('')
    void set('constraints', [...ips.constraints, text])
  }

  async function approve() {
    setApproving(true)
    try {
      await onApprove()
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-2 text-sm">
            <IpsStatusBadge status={status} />
            {status === 'approved' && approvedAt && <span className="text-muted-foreground">{t('advisor.ips.approvedAt', { date: formatDate(approvedAt) })}</span>}
          </div>
          {status === 'pending' && (
            <Button size="sm" onClick={approve} disabled={approving}>
              {approving ? t('advisor.ips.approving') : t('advisor.ips.approve')}
            </Button>
          )}
          {status === 'pending' && <p className="w-full text-xs text-muted-foreground">{t('advisor.ips.pendingHint')}</p>}
          {status === 'none' && <p className="w-full text-xs text-muted-foreground">{t('advisor.ips.noneHint')}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextareaField label={t('advisor.fields.objective')} value={ips.objective} onCommit={(v) => set('objective', v)} />
          </div>
          <NumberField label={t('advisor.fields.horizonYears')} value={ips.horizon_years} onCommit={(v) => set('horizon_years', v)} min={0} max={80} />
          <SelectField
            label={t('advisor.fields.reviewCadence')}
            value={ips.review_cadence}
            options={REVIEW_CADENCES}
            optionLabel={(v) => t(`advisor.options.cadence.${v}`)}
            onCommit={(v) => set('review_cadence', v)}
          />
          <TextareaField label={t('advisor.fields.rebalanceRule')} value={ips.rebalance_rule} onCommit={(v) => set('rebalance_rule', v)} />
          <TextareaField label={t('advisor.fields.contributionPlan')} value={ips.contribution_plan} onCommit={(v) => set('contribution_plan', v)} />
          <div className="sm:col-span-2">
            <TextareaField label={t('advisor.fields.notes')} value={ips.notes} onCommit={(v) => set('notes', v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('advisor.ips.allocation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AllocationBars targets={ips.target_allocation} />
          {targets.map((a, i) => (
            <div key={`${a.asset_class}-${i}`} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-4">
              <SelectField
                label={t('advisor.fields.assetClass')}
                value={a.asset_class}
                options={ASSET_CLASSES}
                optionLabel={(v) => t(`advisor.options.assetClass.${v}`)}
                onCommit={(v) => updateTarget(i, { asset_class: v })}
              />
              <NumberField label={t('advisor.fields.weight')} value={a.weight} onCommit={(v) => updateTarget(i, { weight: v ?? 0 })} min={0} max={100} nullable={false} />
              <NumberField label={t('advisor.fields.band')} value={a.band} onCommit={(v) => updateTarget(i, { band: v ?? 5 })} min={0} max={50} nullable={false} />
              <div className="flex items-end justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeTarget(i)} className="gap-1.5 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('advisor.remove')}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-xs ${check.ok ? 'text-muted-foreground' : 'text-destructive'}`}>
              {t('advisor.ips.weightsTotal', { n: check.total })}
              {!check.ok && ` · ${t('advisor.ips.weightsBad')}`}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={addTarget} disabled={targets.length >= ASSET_CLASSES.length} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t('advisor.addAsset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('advisor.fields.constraints')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="space-y-1 text-sm">
            {ips.constraints.map((c, i) => (
              <li key={`${c}-${i}`} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5">
                <span>{c}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => set('constraints', ips.constraints.filter((_, j) => j !== i))} aria-label={t('advisor.remove')}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              value={constraint}
              onChange={(e) => setConstraint(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addConstraint()}
              placeholder={t('advisor.constraintPlaceholder')}
              aria-label={t('advisor.addConstraint')}
              className="h-9"
            />
            <Button type="button" size="sm" variant="outline" onClick={addConstraint} disabled={!constraint.trim()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t('advisor.addConstraint')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
