'use client'

import { memo } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export const Sparkline = memo(function Sparkline({ data, width = 100, height = 30, color }: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }))
  const isPositive = data[data.length - 1] >= data[0]
  const strokeColor = color || (isPositive ? '#10b981' : '#ef4444')
  
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={strokeColor}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
})
