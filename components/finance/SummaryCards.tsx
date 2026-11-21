'use client'

import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline } from '@/components/finance/Sparkline'
import { transactionsService } from '@/lib/services/transactions.service'
import { accountsService } from '@/lib/services/accounts.service'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { financialDataService } from '@/lib/services/financial-data.service'
import { formatCurrency } from '@/lib/format'
import { useCountUp } from '@/lib/hooks/use-count-up'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

const POSITIVE = 'var(--positive)'
const NEGATIVE = 'var(--destructive)'

interface SummaryData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  prevIncome: number | null
  prevExpenses: number | null
  prevNet: number | null
  /** last 12 months, oldest first */
  trend: { income: number[]; expenses: number[]; net: number[]; balance: number[] }
}

interface SummaryCardsProps {
  title?: string
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Percentage change, null when the previous value is zero or unknown. */
function pctChange(now: number, prev: number | null): number | null {
  if (prev === null || prev === 0) return null
  return ((now - prev) / Math.abs(prev)) * 100
}

function Delta({ pct, goodWhenUp, label }: { pct: number | null; goodWhenUp: boolean; label: string }) {
  if (pct === null) return <span className="text-[11px] text-muted-foreground">{label}</span>
  const flat = Math.abs(pct) < 0.5
  const up = pct > 0
  const good = flat ? null : up === goodWhenUp
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <span
        className={cn(
          'num inline-flex items-center gap-0.5 rounded px-1 py-px font-medium',
          good === null && 'bg-muted text-foreground/70',
          good === true && 'bg-positive/10 text-positive',
          good === false && 'bg-destructive/10 text-destructive',
        )}
      >
        <Icon className="h-3 w-3" strokeWidth={2.25} />
        {Math.abs(pct) >= 100 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(1)}%
      </span>
      {label}
    </span>
  )
}

function Figure({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const shown = useCountUp(value)
  return (
    <p className={cn('figure whitespace-nowrap text-[26px] leading-none sm:text-[28px]', className)} style={style}>
      {formatCurrency(shown)}
    </p>
  )
}

export function SummaryCards({ title }: SummaryCardsProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<SummaryData | null>(null)
  const [monthLabel, setMonthLabel] = useState('')
  const [prevLabel, setPrevLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1)
    const events = ['transactions-updated', 'workspace-changed']
    events.forEach((e) => window.addEventListener(e, refresh))
    return () => events.forEach((e) => window.removeEventListener(e, refresh))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const now = new Date()
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const locale = t('summary.localeCode')
        setMonthLabel(now.toLocaleString(locale, { month: 'long', year: 'numeric' }))
        setPrevLabel(prev.toLocaleString(locale, { month: 'short' }))

        const [balanceRes, monthly, previous, accounts, thisYear, lastYear] = await Promise.all([
          transactionsService.getBalance(),
          financialSummaryService.getMonthly(monthKey(now)),
          financialSummaryService.getMonthly(monthKey(prev)).catch(() => null),
          accountsService.list(true),
          financialDataService.getByYear(now.getFullYear()).catch(() => null),
          financialDataService.getByYear(now.getFullYear() - 1).catch(() => null),
        ])
        if (cancelled) return

        const totalAccountBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0)

        // twelve months ending this month, from the two yearly series
        const series = [...(lastYear?.monthlyData ?? []), ...(thisYear?.monthlyData ?? [])]
        const endIndex = (lastYear?.monthlyData?.length ?? 0) + now.getMonth() + 1
        const window12 = series.slice(Math.max(0, endIndex - 12), endIndex)
        const trend = {
          income: window12.map((m) => m.income),
          expenses: window12.map((m) => Math.abs(m.expenses)),
          net: window12.map((m) => m.net),
          balance: window12.map((m) => m.netWorth),
        }

        setData({
          totalBalance: totalAccountBalance || balanceRes.balance,
          monthlyIncome: monthly.income,
          monthlyExpenses: Math.abs(monthly.expenses),
          monthlyNet: monthly.net,
          prevIncome: previous ? previous.income : null,
          prevExpenses: previous ? Math.abs(previous.expenses) : null,
          prevNet: previous ? previous.net : null,
          trend,
        })
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('summary.error'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchData()
    return () => {
      cancelled = true
    }
  }, [refreshKey, t])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-36" />
            <Skeleton className="mt-3 h-3 w-20" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <p className="p-4 text-sm text-destructive">{error}</p>
      </Card>
    )
  }

  if (!data) return null

  const netPositive = data.monthlyNet >= 0
  const vsPrev = t('dashboard.kpi.vsPrev', { month: prevLabel })
  const noPrev = t('dashboard.kpi.noPrev')

  const cards = [
    {
      label: t('summary.totalBalance'),
      value: data.totalBalance,
      foot: <span className="text-[11px] text-muted-foreground">{t('dashboard.kpi.balanceHelp')}</span>,
      spark: data.trend.balance,
      sparkColor: 'var(--primary)',
      hero: true,
    },
    {
      label: t('summary.monthlyIncome'),
      value: data.monthlyIncome,
      foot: <Delta pct={pctChange(data.monthlyIncome, data.prevIncome)} goodWhenUp label={data.prevIncome === null ? noPrev : vsPrev} />,
      spark: data.trend.income,
      sparkColor: POSITIVE,
    },
    {
      label: t('summary.monthlyExpenses'),
      value: data.monthlyExpenses,
      foot: <Delta pct={pctChange(data.monthlyExpenses, data.prevExpenses)} goodWhenUp={false} label={data.prevExpenses === null ? noPrev : vsPrev} />,
      spark: data.trend.expenses,
      sparkColor: NEGATIVE,
    },
    {
      label: t('summary.monthlyNet'),
      value: data.monthlyNet,
      foot: <Delta pct={pctChange(data.monthlyNet, data.prevNet)} goodWhenUp label={data.prevNet === null ? noPrev : vsPrev} />,
      spark: data.trend.net,
      sparkColor: netPositive ? POSITIVE : NEGATIVE,
      valueColor: netPositive ? POSITIVE : NEGATIVE,
    },
  ]

  return (
    <section aria-label={title ?? t('summary.totalBalance')}>
      {title && <h3 className="mb-3 text-sm font-semibold">{title}</h3>}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card, i) => (
          <Card
            key={card.label}
            className={cn('enter relative overflow-hidden p-5', card.hero && 'col-span-2 bg-primary text-primary-foreground xl:col-span-1 dark:bg-card dark:text-card-foreground')}
            style={{ '--i': i } as React.CSSProperties}
          >
            <div className="flex items-start justify-between gap-3">
              <p className={cn('eyebrow', card.hero && 'text-primary-foreground/70 dark:text-muted-foreground')}>{card.label}</p>
              {card.hero && <span className="num rounded bg-primary-foreground/15 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider dark:bg-muted">{monthLabel}</span>}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <Figure value={card.value} style={card.valueColor ? { color: card.valueColor } : undefined} />
                <div className={cn('mt-2.5', card.hero && '[&_span]:text-primary-foreground/70 dark:[&_span]:text-muted-foreground')}>{card.foot}</div>
              </div>
              {card.spark.length > 1 && (
                <Sparkline
                  values={card.spark}
                  color={card.hero ? 'currentColor' : card.sparkColor}
                  width={96}
                  height={34}
                  className={cn('hidden shrink-0 sm:block', card.hero && 'text-primary-foreground/80 dark:text-primary')}
                />
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
