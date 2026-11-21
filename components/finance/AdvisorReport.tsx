'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AllocationBars } from '@/components/advisor/AllocationBars'
import { IpsStatusBadge } from '@/components/advisor/IpsStatusBadge'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, formatDate, formatSignedCurrency } from '@/lib/format'
import { formatMonthsCovered, sortChecks } from '@/lib/profile-edit'
import { profileService } from '@/lib/services/profile.service'
import type { AdvisorReview, CheckSeverity } from '@/lib/types/profile'

interface AdvisorReportProps {
  title?: string
  params?: {
    /** Period length in months (default 12, max 60). */
    months?: number
  }
}

const SEVERITY_STYLE: Record<CheckSeverity, string> = {
  critical: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400',
  info: 'border-border bg-muted/40 text-muted-foreground',
}

function SeverityIcon({ severity }: { severity: CheckSeverity }) {
  const cls = 'mt-0.5 h-4 w-4 shrink-0'
  if (severity === 'critical') return <AlertOctagon className={cls} />
  if (severity === 'warning') return <AlertTriangle className={cls} />
  return <Info className={cls} />
}

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'ok' | 'bad' }) {
  const toneCls = tone === 'bad' ? 'text-red-600 dark:text-red-400' : tone === 'ok' ? 'text-green-600 dark:text-green-400' : ''
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** The periodic review: the figures and the failing checks the advisor's recommendations rest on. */
export function AdvisorReport({ title, params }: AdvisorReportProps) {
  const { t, locale } = useTranslation()
  const months = params?.months && params.months > 0 ? Math.min(params.months, 60) : 12
  const [data, setData] = useState<AdvisorReview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    profileService
      .review(months)
      .then((r) => {
        setData(r)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('advisorReport.loadError')))
  }, [months, t])

  useEffect(() => {
    load()
    const events = ['profile-updated', 'workspace-changed', 'transactions-updated']
    events.forEach((e) => window.addEventListener(e, load))
    return () => events.forEach((e) => window.removeEventListener(e, load))
  }, [load])

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  const { cash_flow: flow, net_worth: nw, emergency_fund: fund, debts, allocation } = data
  const rate = flow.saving_rate
  const checks = sortChecks(data.checks)
  const intlLocale = locale === 'it' ? 'it-IT' : 'en-US'
  const pct = (v: number) => new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1 }).format(v)
  const checkMessage = (key: string, fallback: string) => {
    const translated = t(`advisorReport.messages.${key}`)
    return translated.startsWith('advisorReport.messages.') ? fallback : translated
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{title ?? t('advisorReport.title')}</CardTitle>
          <IpsStatusBadge status={data.profile.ips_status} />
        </div>
        <p className="text-xs text-muted-foreground">{t('advisorReport.period', { n: data.period.months, date: formatDate(data.as_of) })}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile
            label={t('advisorReport.netWorth')}
            value={nw.has_balances && nw.total !== null ? formatCurrency(nw.total) : t('advisorReport.unknown')}
            hint={nw.change_on_previous_month !== null && nw.has_balances ? `${formatSignedCurrency(nw.change_on_previous_month)} ${t('advisorReport.change')}` : undefined}
          />
          <Tile
            label={t('advisorReport.savingRate')}
            value={rate === null ? t('advisorReport.unknown') : `${pct(rate * 100)}%`}
            hint={
              flow.months_with_data
                ? t('advisorReport.flows', {
                    income: formatCurrency(flow.income_monthly_avg ?? 0),
                    expenses: formatCurrency(flow.expenses_monthly_avg ?? 0),
                  })
                : t('advisorReport.noFlows')
            }
            tone={rate === null ? undefined : rate < 0 ? 'bad' : rate >= 0.1 ? 'ok' : undefined}
          />
          <Tile
            label={t('advisorReport.emergency')}
            value={fund.amount === null ? t('advisorReport.unknown') : formatMonthsCovered(fund.months_covered, fund.target_months, intlLocale)}
            hint={
              fund.amount === null
                ? t('advisorReport.fundUnknown')
                : fund.shortfall
                  ? t('advisorReport.shortfall', { amount: formatCurrency(fund.shortfall) })
                  : t('advisorReport.fundOk')
            }
            tone={fund.amount === null ? undefined : fund.shortfall ? 'bad' : 'ok'}
          />
          <Tile
            label={t('advisorReport.debts')}
            value={debts.count ? formatCurrency(debts.balance_total) : t('advisorReport.debtsNone')}
            hint={debts.expensive.length ? t('advisorReport.expensive', { n: debts.expensive.length, rate: debts.expensive_threshold_rate }) : undefined}
            tone={debts.expensive.length ? 'bad' : undefined}
          />
        </div>

        <div>
          <p className="mb-1.5 font-medium">{t('advisorReport.checks')}</p>
          {checks.length === 0 ? (
            <p className="text-muted-foreground">{t('advisorReport.noChecks')}</p>
          ) : (
            <ul className="space-y-1.5">
              {checks.map((c) => (
                <li key={c.key} className={`flex items-start gap-2 rounded-lg border p-2 ${SEVERITY_STYLE[c.severity]}`}>
                  <SeverityIcon severity={c.severity} />
                  <div className="min-w-0 flex-1">
                    <p>{checkMessage(c.key, c.message)}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {t(`advisorReport.severity.${c.severity}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1.5 font-medium">{t('advisorReport.allocation')}</p>
          {allocation.current ? (
            <p className="text-muted-foreground">
              {t('advisorReport.current')}: {t('advisorReport.cash')} {pct(allocation.current.cash)}% · {t('advisorReport.invested')}{' '}
              {pct(allocation.current.invested)}%
              {allocation.cash_weight_drift !== null && <> · {t('advisorReport.drift', { n: pct(allocation.cash_weight_drift) })}</>}
            </p>
          ) : (
            <p className="text-muted-foreground">{t('advisorReport.noAllocation')}</p>
          )}
          <div className="mt-2">
            {allocation.target.length ? (
              <>
                <p className="mb-1 text-xs text-muted-foreground">{t('advisorReport.target')}</p>
                <AllocationBars targets={allocation.target} />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{t('advisorReport.noTarget')}</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1.5 font-medium">{t('advisorReport.openDecisions')}</p>
          {data.open_decisions.length === 0 ? (
            <p className="text-muted-foreground">{t('advisorReport.noDecisions')}</p>
          ) : (
            <ul className="space-y-1">
              {data.open_decisions.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{formatDate(d.date)}</span>
                  <span>{d.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {t(`advisor.options.decisionStatus.${d.status}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {flow.expenses_coverage?.reviewed_share !== undefined && flow.months_with_data > 0 && (
          <p className="text-xs text-muted-foreground">{t('advisorReport.coverage', { n: pct(flow.expenses_coverage.reviewed_share * 100) })}</p>
        )}
        <p className="text-xs text-muted-foreground">{t('advisorReport.dataNote')}</p>
      </CardContent>
    </Card>
  )
}
