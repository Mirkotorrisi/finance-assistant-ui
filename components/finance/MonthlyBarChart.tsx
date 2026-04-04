'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { financialDataService } from '@/lib/services/financial-data.service'
import { formatCurrency } from '@/lib/format'
import type { MonthlyDataPoint } from '@/lib/types/financial-data'

interface MonthlyBarChartProps {
  title?: string
  year?: number
}

export function MonthlyBarChart({
  title = 'Monthly Overview',
  year = new Date().getFullYear(),
}: MonthlyBarChartProps) {
  const [data, setData] = useState<MonthlyDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    financialDataService
      .getByYear(year)
      .then((res) => setData(res.monthly_data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load financial data'))
      .finally(() => setLoading(false))
  }, [year])

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
          <p className="text-sm text-muted-foreground">No data available for {year}.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v: number) => formatCurrency(v, undefined, true)} />
              <Tooltip formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#16a34a" />
              <Bar dataKey="expenses" name="Expenses" fill="#dc2626" />
              <Bar dataKey="net" name="Net" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
