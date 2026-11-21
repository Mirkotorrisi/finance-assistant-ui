'use client'

import { Card, CardContent } from '@/components/ui/card'
import { NumberField, SelectField, TextareaField } from '@/components/advisor/fields'
import { useTranslation } from '@/lib/i18n'
import { patchAt } from '@/lib/profile-edit'
import { DRAWDOWN_REACTIONS, EXPERIENCES, type Risk } from '@/lib/types/profile'

interface Props {
  risk: Risk
  onPatch: (doc: Record<string, unknown>) => Promise<void>
}

export function RiskForm({ risk, onPatch }: Props) {
  const { t } = useTranslation()
  const set = (field: keyof Risk, value: unknown) => onPatch(patchAt(`risk.${field}`, value))
  return (
    <Card>
      <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
        <NumberField label={t('advisor.fields.tolerance')} value={risk.tolerance} onCommit={(v) => set('tolerance', v)} min={1} max={5} />
        <NumberField label={t('advisor.fields.capacity')} value={risk.capacity} onCommit={(v) => set('capacity', v)} min={1} max={5} />
        <TextareaField label={t('advisor.fields.toleranceReason')} value={risk.tolerance_reason} onCommit={(v) => set('tolerance_reason', v)} />
        <TextareaField label={t('advisor.fields.capacityReason')} value={risk.capacity_reason} onCommit={(v) => set('capacity_reason', v)} />
        <SelectField label={t('advisor.fields.experience')} value={risk.experience} options={EXPERIENCES} optionLabel={(v) => t(`advisor.options.experience.${v}`)} onCommit={(v) => set('experience', v)} />
        <SelectField
          label={t('advisor.fields.drawdownReaction')}
          value={risk.drawdown_reaction}
          options={DRAWDOWN_REACTIONS}
          optionLabel={(v) => t(`advisor.options.drawdown.${v}`)}
          onCommit={(v) => set('drawdown_reaction', v)}
        />
        <div className="sm:col-span-2">
          <TextareaField label={t('advisor.fields.notes')} value={risk.notes} onCommit={(v) => set('notes', v)} />
        </div>
      </CardContent>
    </Card>
  )
}
