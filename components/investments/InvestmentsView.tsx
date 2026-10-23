'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, Info } from 'lucide-react'
import { investmentsService } from '@/lib/services/investments.service'
import { formatCompact, formatCurrency, formatSignedCurrency } from '@/lib/format'
import { SERIES_COLORS } from '@/lib/chart-colors'
import { useTranslation } from '@/lib/i18n'
import type { Portfolio } from '@/lib/types/investments'

const GAIN = 'oklch(0.52 0.17 162)'
const LOSS = 'oklch(0.55 0.23 16)'

export function resultColor(value: number): string {
  return value > 0 ? GAIN : value < 0 ? LOSS : 'var(--muted-foreground)'
}

export function InvestmentsView() {
  const { t, tr } = useTranslation()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      investmentsService
        .portfolio()
        .then(setPortfolio)
        .catch((err) => setError(err instanceof Error ? err.message : t('investments.loadError')))
        .finally(() => setLoading(false))
    }
    load()
    const events = ['transactions-updated', 'workspace-changed', 'blueprint-saved']
    events.forEach((e) => window.addEventListener(e, load))
    return () => events.forEach((e) => window.removeEventListener(e, load))
  }, [t])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!portfolio) return null

  const { totals, positions, by_month } = portfolio
  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-6">
          <h2 className="text-base font-semibold">{t('investments.emptyTitle')}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">{t('investments.emptyBody')}</p>
          <Button asChild size="sm">
            <Link href="/blueprint">{t('investments.emptyAction')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const tiles = [
    { label: t('investments.result'), help: t('investments.resultHelp'), value: formatSignedCurrency(totals.realized_result), color: resultColor(totals.realized_result), hero: true },
    { label: t('investments.invested'), value: formatCurrency(totals.invested) },
    { label: t('investments.proceeds'), value: formatCurrency(totals.proceeds) },
    { label: t('investments.dividends'), value: formatCurrency(totals.dividends) },
  ]
  const months = by_month.map((m) => ({
    ...m,
    label: new Date(`${m.month}-01T12:00:00`).toLocaleDateString(tr.summary.localeCode, { month: 'short', year: '2-digit' }),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className={tile.hero ? 'col-span-2 lg:col-span-1' : undefined}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
              <p
                className="mt-2 whitespace-nowrap text-xl font-bold tracking-tight tabular-nums sm:text-2xl"
                style={tile.color ? { color: tile.color } : undefined}
              >
                {tile.value}
              </p>
              {tile.help && <p className="mt-1 text-xs text-muted-foreground">{tile.help}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 rounded-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p>
            <span className="font-medium text-foreground">{t('investments.stillInvested')}: {formatCurrency(totals.cost_basis_open)}</span>
            {' — '}{t('investments.stillInvestedHelp')}
          </p>
          <p>{t('investments.noPrices')}</p>
        </div>
      </div>

      {totals.unresolved_instruments > 0 && (
        <div className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            {t(totals.unresolved_instruments === 1 ? 'investments.unresolvedOne' : 'investments.unresolved', {
              n: totals.unresolved_instruments,
              flow: formatSignedCurrency(totals.unresolved_net_flow),
            })}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('investments.positions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('investments.instrument')}</TableHead>
                  <TableHead>{t('investments.status')}</TableHead>
                  <TableHead className="text-right">{t('investments.colInvested')}</TableHead>
                  <TableHead className="text-right">{t('investments.colReturned')}</TableHead>
                  <TableHead className="text-right">{t('investments.colResult')}</TableHead>
                  <TableHead className="text-right">{t('investments.colHeld')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p) => (
                  <TableRow key={p.key}>
                    <TableCell className="min-w-56">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[p.isin, t('investments.trades', { n: p.trades }), p.quantity ? `${t('investments.quantity')} ${p.quantity}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {p.status === 'closed' ? t('investments.closed') : t('investments.open')}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{formatCurrency(p.invested)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{formatCurrency(p.proceeds + p.dividends)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                      {p.result === null ? (
                        <span
                          className="text-xs font-normal text-muted-foreground"
                          title={t('investments.cashFlowHelp', { flow: formatSignedCurrency(p.net_flow) })}
                        >
                          {t('investments.cashFlowOnly')} {formatSignedCurrency(p.net_flow)}
                        </span>
                      ) : (
                        <span style={{ color: resultColor(p.result) }}>{formatSignedCurrency(p.result)}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {p.open_cost > 0 ? formatCurrency(p.open_cost) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {months.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('investments.monthly')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis width={44} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                  formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--popover-foreground)' }}
                  labelStyle={{ color: 'var(--popover-foreground)', fontWeight: 600 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
                />
                <Bar dataKey="invested" name={t('investments.investedSeries')} fill={SERIES_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
                <Bar dataKey="returned" name={t('investments.returnedSeries')} fill={SERIES_COLORS[2]} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
