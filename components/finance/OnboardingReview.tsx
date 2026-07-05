'use client'

import { useState, KeyboardEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { preferencesService } from '@/lib/services/preferences.service'
import { CheckCircle, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface OnboardingReviewProps {
  title?: string
  params?: {
    userId: string
    focusCategories: string[]
    customCategories: string[]
    budgetAmount: number | null
    budgetPeriod: string
    notes: string | null
  }
}

type ConfirmState = 'idle' | 'loading' | 'success' | 'error'

function TagList({
  tags,
  onRemove,
  onAdd,
  placeholder,
  emptyLabel,
}: {
  tags: string[]
  onRemove: (tag: string) => void
  onAdd: (tag: string) => void
  placeholder: string
  emptyLabel: string
}) {
  const [draft, setDraft] = useState('')

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const value = draft.trim()
    if (value && !tags.includes(value)) onAdd(value)
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground">{emptyLabel}</span>
        )}
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="rounded-sm hover:bg-muted-foreground/20"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  )
}

export function OnboardingReview({ title, params }: OnboardingReviewProps) {
  const { t } = useTranslation()

  const [focusCategories, setFocusCategories] = useState<string[]>(params?.focusCategories ?? [])
  const [customCategories, setCustomCategories] = useState<string[]>(params?.customCategories ?? [])
  const [budgetAmount, setBudgetAmount] = useState<string>(
    params?.budgetAmount != null ? String(params.budgetAmount) : ''
  )
  const [budgetPeriod, setBudgetPeriod] = useState(params?.budgetPeriod ?? 'monthly')
  const [notes, setNotes] = useState(params?.notes ?? '')
  const [confirmState, setConfirmState] = useState<ConfirmState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!params) return null

  async function handleConfirm() {
    setConfirmState('loading')
    setErrorMsg('')

    try {
      await preferencesService.update(params!.userId, {
        focus_categories: focusCategories,
        custom_categories: customCategories,
        budget_amount: budgetAmount.trim() === '' ? null : Number(budgetAmount),
        budget_period: budgetPeriod,
        notes: notes.trim() === '' ? null : notes,
      })
      await preferencesService.confirm(params!.userId)
      setConfirmState('success')
      window.dispatchEvent(new Event('preferences-updated'))
    } catch (err) {
      setConfirmState('error')
      setErrorMsg(err instanceof Error ? err.message : t('onboardingReview.error'))
    }
  }

  if (confirmState === 'success') {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {t('onboardingReview.success')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title ?? t('onboardingReview.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('onboardingReview.subtitle')}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium">{t('onboardingReview.focusCategories')}</p>
          <TagList
            tags={focusCategories}
            onRemove={(tag) => setFocusCategories((prev) => prev.filter((c) => c !== tag))}
            onAdd={(tag) => setFocusCategories((prev) => [...prev, tag])}
            placeholder={t('onboardingReview.addPlaceholder')}
            emptyLabel={t('onboardingReview.noCategories')}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">{t('onboardingReview.customCategories')}</p>
          <TagList
            tags={customCategories}
            onRemove={(tag) => setCustomCategories((prev) => prev.filter((c) => c !== tag))}
            onAdd={(tag) => setCustomCategories((prev) => [...prev, tag])}
            placeholder={t('onboardingReview.addPlaceholder')}
            emptyLabel={t('onboardingReview.noCategories')}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">{t('onboardingReview.budget')}</p>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="0"
              className="h-9 w-32"
            />
            <Select
              value={budgetPeriod}
              onChange={(e) => setBudgetPeriod(e.target.value)}
              className="h-9 w-40"
            >
              <option value="monthly">{t('onboardingReview.budgetPeriodMonthly')}</option>
              <option value="weekly">{t('onboardingReview.budgetPeriodWeekly')}</option>
              <option value="yearly">{t('onboardingReview.budgetPeriodYearly')}</option>
            </Select>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">{t('onboardingReview.notes')}</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('onboardingReview.notesPlaceholder')}
            className="text-sm"
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {confirmState === 'error' && <p className="text-xs text-destructive">{errorMsg}</p>}
          <Button
            onClick={handleConfirm}
            disabled={confirmState === 'loading'}
            size="sm"
            className="self-end"
          >
            {confirmState === 'loading' ? t('onboardingReview.confirming') : t('onboardingReview.confirm')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
