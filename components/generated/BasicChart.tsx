import { ChartContract } from '@/lib/schemas/generated-ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface BasicChartProps {
  contract: ChartContract
}

export function BasicChart({ contract }: BasicChartProps) {
  const { data, metadata } = contract
  const { chartType, series, labels, xAxisLabel, yAxisLabel } = data

  // Transform data for Recharts
  const chartData = labels.map((label, index) => {
    const dataPoint: Record<string, string | number> = { name: label }
    series.forEach((s) => {
      dataPoint[s.name] = s.data[index] ?? 0
    })
    return dataPoint
  })

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {series.map((s, i) => (
              <Bar key={s.name} dataKey={s.name} fill={colors[i % colors.length]} />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {series.map((s, i) => (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.name}
                fill={colors[i % colors.length]}
                stroke={colors[i % colors.length]}
              />
            ))}
          </AreaChart>
        )
    }
  }

  return (
    <Card>
      {(metadata?.title || metadata?.description) && (
        <CardHeader>
          {metadata?.title && <CardTitle>{metadata.title}</CardTitle>}
          {metadata?.description && (
            <CardDescription>{metadata.description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
