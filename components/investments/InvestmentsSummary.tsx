'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Briefcase } from 'lucide-react'
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
      className="lift group enter flex flex-wrap items-center gap-x-10 gap-y-3 rounded-xl border border-border/80 bg-card px-5 py-4 shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      style={{ '--i': 4 } as React.CSSProperties}
    >
      <span className="flex items-center gap-2.5 text-sm font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/8 text-primary dark:bg-muted">
          <Briefcase className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {t('investments.card.title')}
      </span>
      {stats.map((s) => (
        <span key={s.label} className="flex flex-col gap-0.5">
          <span className="eyebrow">{s.label}</span>
          <span className="num whitespace-nowrap text-[15px] font-semibold" style={s.color ? { color: s.color } : undefined}>
            {s.value}
          </span>
        </span>
      ))}
      <span className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {t('investments.card.details')}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
