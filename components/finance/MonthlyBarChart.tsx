'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { financialDataService } from '@/lib/services/financial-data.service'
import { formatCurrency, formatCompact } from '@/lib/format'
import { SERIES_COLORS, SERIES_INK } from '@/lib/chart-colors'
import type { MonthlyDataPoint } from '@/lib/types/financial-data'
import { useTranslation } from '@/lib/i18n'

interface MonthlyBarChartProps {
  title?: string
  year?: number
}

export function MonthlyBarChart({
  title,
  year = new Date().getFullYear(),
}: MonthlyBarChartProps) {
  const { t, tr } = useTranslation()
  const [data, setData] = useState<MonthlyDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1)
    window.addEventListener('transactions-updated', refresh)
    return () => window.removeEventListener('transactions-updated', refresh)
  }, [])

  useEffect(() => {
    financialDataService
      .getByYear(year)
      .then((res) => setData(res.monthlyData))
      .catch((err) => setError(err instanceof Error ? err.message : t('charts.monthlyError')))
      .finally(() => setLoading(false))
  }, [year, refreshKey, t])

  // the API labels months in English: show them in the UI language
  const months = data.map((d, i) => ({
    ...d,
    label: new Date(2000, i, 1).toLocaleDateString(tr.summary.localeCode, { month: 'short' }),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? t('charts.monthlyOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-muted rounded animate-pulse" />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('charts.noDataYear', { year })}</p>
        ) : (
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <ComposedChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
              <YAxis
                width={44}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--popover-foreground)',
                }}
                labelStyle={{ color: 'var(--popover-foreground)', fontWeight: 600 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
              />
              <Bar dataKey="income" name={t('charts.income')} fill={SERIES_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={14} />
              <Bar dataKey="expenses" name={t('charts.expenses')} fill={SERIES_COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={14} />
              <Line
                dataKey="net"
                name={t('charts.net')}
                type="linear"
                stroke={SERIES_INK}
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--card)', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
