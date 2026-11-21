'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DateField, Field, NumberField, SelectField, TextField, TextareaField } from '@/components/advisor/fields'
import { useTranslation } from '@/lib/i18n'
import { patchAt, uniqueKey } from '@/lib/profile-edit'
import { accountsService } from '@/lib/services/accounts.service'
import type { Account } from '@/lib/types/account'
import {
  DEBT_KINDS,
  HOUSING_STATUSES,
  INCOME_KINDS,
  INCOME_STABILITIES,
  TFR_CHOICES,
  type ClientProfile,
  type Debt,
} from '@/lib/types/profile'

interface Props {
  profile: ClientProfile
  onPatch: (doc: Record<string, unknown>) => Promise<void>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">{children}</CardContent>
    </Card>
  )
}

export function ProfileForm({ profile, onPatch }: Props) {
  const { t } = useTranslation()
  const s = profile.situation
  const set = (path: string, value: unknown) => onPatch(patchAt(path, value))
  const opt = (group: string) => (v: string) => t(`advisor.options.${group}.${v}`)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [newDebt, setNewDebt] = useState('')

  useEffect(() => {
    accountsService
      .list()
      .then(setAccounts)
      .catch(() => setAccounts([]))
  }, [])

  const toggleFundAccount = (id: number) => {
    const ids = s.emergency_fund.account_ids.includes(id)
      ? s.emergency_fund.account_ids.filter((x) => x !== id)
      : [...s.emergency_fund.account_ids, id]
    void set('situation.emergency_fund.account_ids', ids)
  }

  const saveDebts = (debts: Debt[]) => onPatch({ situation: { debts } })
  const addDebt = () => {
    const label = newDebt.trim()
    if (!label) return
    const debt: Debt = {
      key: uniqueKey(label, s.debts),
      label,
      kind: 'other',
      balance: null,
      annual_rate: null,
      monthly_payment: null,
      end_date: null,
      notes: '',
    }
    setNewDebt('')
    void saveDebts([...s.debts, debt])
  }
  const updateDebt = (key: string, changes: Partial<Debt>) =>
    saveDebts(s.debts.map((d) => (d.key === key ? { ...d, ...changes } : d)))
  const removeDebt = (key: string) => saveDebts(s.debts.filter((d) => d.key !== key))

  return (
    <div className="space-y-4">
      <Section title={t('advisor.sections.income')}>
        <NumberField label={t('advisor.fields.netMonthly')} value={s.income.net_monthly} onCommit={(v) => set('situation.income.net_monthly', v)} min={0} />
        <SelectField label={t('advisor.fields.incomeKind')} value={s.income.kind} options={INCOME_KINDS} optionLabel={opt('incomeKind')} onCommit={(v) => set('situation.income.kind', v)} />
        <SelectField label={t('advisor.fields.stability')} value={s.income.stability} options={INCOME_STABILITIES} optionLabel={opt('stability')} onCommit={(v) => set('situation.income.stability', v)} />
        <NumberField label={t('advisor.fields.monthsPerYear')} value={s.income.months_per_year} onCommit={(v) => set('situation.income.months_per_year', v)} min={12} max={15} nullable={false} />
        <div className="sm:col-span-2">
          <TextareaField label={t('advisor.fields.notes')} value={s.income.notes} onCommit={(v) => set('situation.income.notes', v)} />
        </div>
      </Section>

      <Section title={t('advisor.sections.expenses')}>
        <NumberField
          label={t('advisor.fields.expensesMonthly')}
          value={s.expenses_monthly}
          onCommit={(v) => set('situation.expenses_monthly', v)}
          hint={t('advisor.fields.expensesHint')}
          min={0}
        />
      </Section>

      <Section title={t('advisor.sections.emergencyFund')}>
        <NumberField label={t('advisor.fields.targetMonths')} value={s.emergency_fund.target_months} onCommit={(v) => set('situation.emergency_fund.target_months', v)} min={0} max={24} nullable={false} />
        <NumberField label={t('advisor.fields.fundAmount')} value={s.emergency_fund.amount} onCommit={(v) => set('situation.emergency_fund.amount', v)} min={0} />
        {accounts.length > 0 && (
          <div className="sm:col-span-2">
            <Field label={t('advisor.fields.fundAccounts')}>
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((a) => {
                  const on = s.emergency_fund.account_ids.includes(a.id)
                  return (
                    <Button key={a.id} type="button" size="sm" variant={on ? 'default' : 'outline'} onClick={() => toggleFundAccount(a.id)} aria-pressed={on}>
                      {a.name}
                    </Button>
                  )
                })}
              </div>
            </Field>
          </div>
        )}
        <div className="sm:col-span-2">
          <TextareaField label={t('advisor.fields.notes')} value={s.emergency_fund.notes} onCommit={(v) => set('situation.emergency_fund.notes', v)} />
        </div>
      </Section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('advisor.sections.debts')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {s.debts.length === 0 && <p className="text-sm text-muted-foreground">{t('advisor.noDebts')}</p>}
          {s.debts.map((d) => (
            <div key={d.key} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-3">
              <TextField label={t('advisor.fields.debtLabel')} value={d.label} onCommit={(v) => updateDebt(d.key, { label: v })} allowEmpty={false} />
              <SelectField label={t('advisor.fields.debtKind')} value={d.kind} options={DEBT_KINDS} optionLabel={opt('debtKind')} onCommit={(v) => updateDebt(d.key, { kind: v })} />
              <NumberField label={t('advisor.fields.balance')} value={d.balance} onCommit={(v) => updateDebt(d.key, { balance: v })} min={0} />
              <NumberField label={t('advisor.fields.annualRate')} value={d.annual_rate} onCommit={(v) => updateDebt(d.key, { annual_rate: v })} min={0} max={100} step={0.1} />
              <NumberField label={t('advisor.fields.monthlyPayment')} value={d.monthly_payment} onCommit={(v) => updateDebt(d.key, { monthly_payment: v })} min={0} />
              <DateField label={t('advisor.fields.endDate')} value={d.end_date} onCommit={(v) => updateDebt(d.key, { end_date: v })} />
              <div className="flex items-end justify-end sm:col-span-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeDebt(d.key)} className="gap-1.5 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('advisor.remove')}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newDebt}
              onChange={(e) => setNewDebt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDebt()}
              placeholder={t('advisor.newDebtPlaceholder')}
              aria-label={t('advisor.addDebt')}
              className="h-9"
            />
            <Button type="button" size="sm" variant="outline" onClick={addDebt} disabled={!newDebt.trim()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t('advisor.addDebt')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Section title={t('advisor.sections.housing')}>
        <SelectField label={t('advisor.fields.housingStatus')} value={s.housing.status} options={HOUSING_STATUSES} optionLabel={opt('housing')} onCommit={(v) => set('situation.housing.status', v)} />
        <NumberField label={t('advisor.fields.monthlyCost')} value={s.housing.monthly_cost} onCommit={(v) => set('situation.housing.monthly_cost', v)} min={0} />
      </Section>

      <Section title={t('advisor.sections.household')}>
        <NumberField label={t('advisor.fields.adults')} value={s.household.adults} onCommit={(v) => set('situation.household.adults', v)} min={1} max={10} nullable={false} />
        <NumberField label={t('advisor.fields.dependents')} value={s.household.dependents} onCommit={(v) => set('situation.household.dependents', v)} min={0} max={20} nullable={false} />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={s.household.shared_finances} onChange={(e) => set('situation.household.shared_finances', e.target.checked)} />
          {t('advisor.fields.sharedFinances')}
        </label>
      </Section>

      <Section title={t('advisor.sections.pension')}>
        <SelectField label={t('advisor.fields.tfr')} value={s.pension.tfr} options={TFR_CHOICES} optionLabel={opt('tfr')} onCommit={(v) => set('situation.pension.tfr', v)} />
        <TextField label={t('advisor.fields.fundName')} value={s.pension.fund_name} onCommit={(v) => set('situation.pension.fund_name', v)} />
        <TextField label={t('advisor.fields.line')} value={s.pension.line} onCommit={(v) => set('situation.pension.line', v)} />
        <NumberField label={t('advisor.fields.annualContribution')} value={s.pension.annual_contribution} onCommit={(v) => set('situation.pension.annual_contribution', v)} min={0} />
        <NumberField label={t('advisor.fields.employerContribution')} value={s.pension.employer_contribution} onCommit={(v) => set('situation.pension.employer_contribution', v)} min={0} />
      </Section>

      <Section title={t('advisor.sections.notes')}>
        <div className="sm:col-span-2">
          <TextareaField label={t('advisor.fields.notes')} value={profile.notes} onCommit={(v) => set('notes', v)} />
        </div>
      </Section>
    </div>
  )
}
