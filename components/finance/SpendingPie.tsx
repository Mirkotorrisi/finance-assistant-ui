'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { formatCurrency, formatPercent } from '@/lib/format'
import { foldSlices, SERIES_COLORS, OTHER_COLOR } from '@/lib/chart-colors'
import type { SpendingDistributionParams } from '@/lib/types/financial-summary'
import { useTranslation } from '@/lib/i18n'

interface SpendingPieProps {
  title?: string
  params?: SpendingDistributionParams
}

export function SpendingPie({ title, params }: SpendingPieProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<{ name: string; amount: number; percent: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1)
    window.addEventListener('transactions-updated', refresh)
    return () => window.removeEventListener('transactions-updated', refresh)
  }, [])

  useEffect(() => {
    const now = new Date()
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const today = now.toISOString().split('T')[0]

    const resolvedParams: SpendingDistributionParams = params ?? {
      start_date: firstOfMonth,
      end_date: today,
      group_by: 'category',
    }

    financialSummaryService
      .getSpendingDistribution(resolvedParams)
      .then((res) => setData(res.distribution))
      .catch((err) => setError(err instanceof Error ? err.message : t('charts.spendingError')))
      .finally(() => setLoading(false))
  }, [params, refreshKey, t])

  const otherLabel = t('charts.other')
  const slices = foldSlices(data, otherLabel)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? t('charts.spendingDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-muted rounded animate-pulse" />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('charts.noSpendingData')}</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="100%"
                    paddingAngle={2}
                    stroke="var(--card)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {slices.map((slice, index) => (
                      <Cell
                        key={slice.name}
                        fill={slice.name === otherLabel ? OTHER_COLOR : SERIES_COLORS[index % SERIES_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | string | undefined) => formatCurrency(Math.abs(Number(value ?? 0)))}
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--popover-foreground)',
                    }}
                    itemStyle={{ color: 'var(--popover-foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full min-w-0 flex-1 space-y-1.5">
              {slices.map((slice, index) => (
                <li key={slice.name} className="flex items-center gap-2 text-xs">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: slice.name === otherLabel ? OTHER_COLOR : SERIES_COLORS[index % SERIES_COLORS.length] }}
                  />
                  <span className="truncate text-muted-foreground" title={slice.name}>{slice.name}</span>
                  <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{formatPercent(Math.abs(slice.percent)).replace(/[,.]00%$/, '%')}</span>
                  <span className="w-24 shrink-0 text-right font-medium tabular-nums">{formatCurrency(Math.abs(slice.amount))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
