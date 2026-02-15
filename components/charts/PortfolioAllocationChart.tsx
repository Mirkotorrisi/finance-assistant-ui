'use client'

import { memo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface AllocationData {
  symbol: string
  value: number
  percentage: number
  [key: string]: string | number
}

interface PortfolioAllocationChartProps {
  data: AllocationData[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export const PortfolioAllocationChart = memo(function PortfolioAllocationChart({ data }: PortfolioAllocationChartProps) {
  return (
    <div className="w-full h-80">
      <h3 className="font-semibold mb-2">Portfolio Allocation</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => {
              const typedEntry = entry as unknown as AllocationData
              return `${typedEntry.symbol} ${typedEntry.percentage.toFixed(1)}%`
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number | undefined) => value !== undefined ? `$${value.toLocaleString()}` : '$0'} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})
