'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { transactionsService } from '@/lib/services/transactions.service'
import { formatCurrency, formatDate } from '@/lib/format'
import { CheckCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface ClassifiedTransaction {
  transaction_id: number
  description: string
  amount: number
  date: string
  new_category: string
}

interface AmbiguousTransaction {
  transaction_id: number
  description: string
  amount: number
  date: string
  suggested_category: string | null
}

interface RecategorizationReviewProps {
  title?: string
  params?: {
    sourceCategory: string
    newCategories: string[]
    classified: ClassifiedTransaction[]
    ambiguous: AmbiguousTransaction[]
  }
}

type ApplyState = 'idle' | 'loading' | 'success' | 'error'

export function RecategorizationReview({ title, params }: RecategorizationReviewProps) {
  const { t } = useTranslation()
  const [showClassified, setShowClassified] = useState(false)
  const [resolutions, setResolutions] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    for (const tx of params?.ambiguous ?? []) {
      if (tx.suggested_category) initial[tx.transaction_id] = tx.suggested_category
    }
    return initial
  })
  const [applyState, setApplyState] = useState<ApplyState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!params) return null

  const { sourceCategory, newCategories, classified, ambiguous } = params

  const unresolvedCount = ambiguous.filter((tx) => !resolutions[tx.transaction_id]).length
  const canApply = unresolvedCount === 0

  async function handleApply() {
    setApplyState('loading')
    setErrorMsg('')

    const updates = [
      ...classified.map((tx) => ({ transaction_id: tx.transaction_id, category: tx.new_category })),
      ...ambiguous.map((tx) => ({ transaction_id: tx.transaction_id, category: resolutions[tx.transaction_id] })),
    ]

    try {
      await transactionsService.bulkUpdateCategories(updates)
      setApplyState('success')
      window.dispatchEvent(new Event('transactions-updated'))
    } catch (err) {
      setApplyState('error')
      setErrorMsg(err instanceof Error ? err.message : t('recategorization.updateError'))
    }
  }

  if (applyState === 'success') {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {t('recategorization.success', { n: classified.length + ambiguous.length })}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {title ?? t('recategorization.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('recategorization.splitting')} <span className="font-semibold text-foreground">{sourceCategory}</span> {t('recategorization.into')}{' '}
          {newCategories.map((c, i) => (
            <span key={c}>
              <Badge variant="secondary" className="text-xs">{c}</Badge>
              {i < newCategories.length - 1 && ' '}
            </span>
          ))}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-classified summary */}
        {classified.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <button
              className="flex w-full items-center justify-between text-sm font-medium"
              onClick={() => setShowClassified((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t('recategorization.classified', { n: classified.length })}
              </span>
              {showClassified ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showClassified && (
              <div className="mt-3 space-y-1.5">
                {classified.map((tx) => (
                  <div key={tx.transaction_id} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[55%] text-muted-foreground">{tx.description}</span>
                    <span className="flex items-center gap-2">
                      <span className={tx.amount < 0 ? 'text-red-500' : 'text-green-600'}>
                        {formatCurrency(tx.amount)}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4">{tx.new_category}</Badge>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ambiguous transactions — require user input */}
        {ambiguous.length > 0 && (
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              {t('recategorization.ambiguous', { n: ambiguous.length })}
            </p>

            {ambiguous.map((tx) => (
              <div
                key={tx.transaction_id}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.date)} ·{' '}
                    <span className={tx.amount < 0 ? 'text-red-500' : 'text-green-600'}>
                      {formatCurrency(tx.amount)}
                    </span>
                  </p>
                </div>

                <Select
                  className="h-8 w-full sm:w-44 text-xs"
                  value={resolutions[tx.transaction_id] ?? ''}
                  onChange={(e) =>
                    setResolutions((prev) => ({ ...prev, [tx.transaction_id]: e.target.value }))
                  }
                >
                  <option value="" disabled>{t('recategorization.selectCategory')}</option>
                  {newCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        )}

        {ambiguous.length === 0 && classified.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('recategorization.noTransactions', { category: sourceCategory })}
          </p>
        )}

        {/* Apply button */}
        {(classified.length > 0 || ambiguous.length > 0) && (
          <div className="flex flex-col gap-2 pt-1">
            {!canApply && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('recategorization.unresolvedWarning', { n: unresolvedCount })}
              </p>
            )}
            {applyState === 'error' && (
              <p className="text-xs text-destructive">{errorMsg}</p>
            )}
            <Button
              onClick={handleApply}
              disabled={!canApply || applyState === 'loading'}
              size="sm"
              className="self-end"
            >
              {applyState === 'loading' ? t('recategorization.updating') : t('recategorization.applyAll')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
