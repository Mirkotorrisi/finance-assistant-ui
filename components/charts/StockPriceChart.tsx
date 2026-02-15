'use client'

import { memo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'

interface PricePoint {
  timestamp: string
  price: number
}

interface StockPriceChartProps {
  data: PricePoint[]
  symbol: string
}

export const StockPriceChart = memo(function StockPriceChart({ data, symbol }: StockPriceChartProps) {
  const isPositive = data[data.length - 1].price >= data[0].price
  
  return (
    <div className="w-full h-64">
      <h3 className="font-semibold mb-2">{symbol} Price History</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
          />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip 
            labelFormatter={(value) => format(new Date(value), 'PPp')}
            formatter={(value: number | undefined) => value !== undefined ? [`$${value.toFixed(2)}`, 'Price'] : ['$0', 'Price']}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
