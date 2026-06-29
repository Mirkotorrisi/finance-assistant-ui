'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { formatCurrency } from '@/lib/format'
import { CHART_PALETTE } from '@/lib/chart-colors'
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, payload }: { name?: string; value?: number; payload?: { percent?: number } }) =>
                  `${name ?? ''} (${Math.abs(payload?.percent ?? 0).toFixed(1)}%)`
                }
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string | undefined) => formatCurrency(Math.abs(Number(value ?? 0)))}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
