'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, ChevronRight } from 'lucide-react'
import { investmentsService } from '@/lib/services/investments.service'
import { formatCurrency, formatSignedCurrency } from '@/lib/format'
import { useTranslation } from '@/lib/i18n'
import { resultColor } from '@/components/investments/InvestmentsView'
import type { InvestmentTotals } from '@/lib/types/investments'

/** One line on the dashboard: investments are tracked apart from spending, so they get their own summary. */
export function InvestmentsSummary() {
  const { t } = useTranslation()
  const [totals, setTotals] = useState<InvestmentTotals | null>(null)

  useEffect(() => {
    const load = () => investmentsService.portfolio().then((p) => setTotals(p.totals.trades > 0 ? p.totals : null)).catch(() => setTotals(null))
    void load()
    const events = ['transactions-updated', 'workspace-changed', 'blueprint-saved']
    events.forEach((e) => window.addEventListener(e, load))
    return () => events.forEach((e) => window.removeEventListener(e, load))
  }, [])

  if (!totals) return null

  const stats = [
    { label: t('investments.card.invested'), value: formatCurrency(totals.invested) },
    { label: t('investments.card.open'), value: formatCurrency(totals.cost_basis_open) },
    { label: t('investments.card.result'), value: formatSignedCurrency(totals.realized_result), color: resultColor(totals.realized_result) },
  ]

  return (
    <Link
      href="/investments"
      className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm transition-colors hover:bg-muted/40"
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Briefcase className="h-3.5 w-3.5" />
        </span>
        {t('investments.card.title')}
      </span>
      {stats.map((s) => (
        <span key={s.label} className="flex flex-col">
          <span className="text-xs text-muted-foreground">{s.label}</span>
          <span className="whitespace-nowrap text-sm font-semibold tabular-nums" style={s.color ? { color: s.color } : undefined}>
            {s.value}
          </span>
        </span>
      ))}
      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        {t('investments.card.details')}
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}
