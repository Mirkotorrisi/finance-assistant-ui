'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { useTranslation } from '@/lib/i18n'
import { bankingService } from '@/lib/services/banking.service'
import type { BankTransaction, SuspectAction, SuspectDuplicate } from '@/lib/types/banking'

interface Props {
  suspects: SuspectDuplicate[]
  onResolved: () => void
}

function Row({ tx, title }: { tx: BankTransaction; title: string }) {
  return (
    <div className="rounded-md border border-border p-2 text-sm">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <p className="font-medium">{formatDate(tx.date)} · {formatCurrency(tx.amount, tx.currency ?? 'EUR')}</p>
      <p className="truncate">{tx.description}</p>
      <p className="text-xs text-muted-foreground">{tx.category_label ?? tx.category}</p>
    </div>
  )
}

export function SuspectsPanel({ suspects, onResolved }: Props) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (suspects.length === 0) return null

  const resolve = async (id: number, action: SuspectAction) => {
    setBusy(id)
    setError(null)
    try {
      await bankingService.resolveSuspect(id, action)
      window.dispatchEvent(new Event('transactions-updated'))
      onResolved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('banking.suspects.error'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('banking.suspects.title', { n: suspects.length })}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('banking.suspects.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {suspects.map(({ transaction, twin }) => (
          <div key={transaction.id} className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Row tx={transaction} title={t('banking.suspects.bankRow')} />
              <Row tx={twin} title={t('banking.suspects.statementRow')} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => resolve(transaction.id, 'delete_this')}>
                {t('banking.suspects.keepStatement')}
              </Button>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => resolve(transaction.id, 'delete_twin')}>
                {t('banking.suspects.keepBank')}
              </Button>
              <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => resolve(transaction.id, 'keep_both')}>
                {t('banking.suspects.keepBoth')}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
