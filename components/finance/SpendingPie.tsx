'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { formatCurrency } from '@/lib/format'
import type { SpendingDistributionParams } from '@/lib/types/financial-summary'

const COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed',
  '#0891b2', '#be185d', '#65a30d', '#ea580c', '#0284c7',
]

interface SpendingPieProps {
  title?: string
  params?: SpendingDistributionParams
}

export function SpendingPie({ title = 'Spending Distribution', params }: SpendingPieProps) {
  const [data, setData] = useState<{ label: string; total: number; percentage: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      .then((res) => setData(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load spending data'))
      .finally(() => setLoading(false))
  }, [params])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No spending data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, payload }: { name?: string; value?: number; payload?: { percentage?: number } }) =>
                  `${name ?? ''} (${Math.abs(payload?.percentage ?? 0).toFixed(1)}%)`
                }
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
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
