import { MetricContract } from '@/lib/schemas/generated-ui'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  contract: MetricContract
}

export function MetricCard({ contract }: MetricCardProps) {
  const { data, metadata } = contract
  const { value, label, trend, format = 'number' } = data

  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(val)
      case 'percentage':
        return `${val.toFixed(2)}%`
      case 'number':
        return new Intl.NumberFormat('en-US').format(val)
      default:
        return String(val)
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null

    switch (trend.direction) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''

    switch (trend.direction) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      case 'neutral':
        return 'text-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold">{formatValue(value)}</p>
          {trend && (
            <div className={cn('flex items-center gap-1', getTrendColor())}>
              {getTrendIcon()}
              {trend.value !== undefined && (
                <span className="text-sm font-medium">{trend.value}%</span>
              )}
            </div>
          )}
        </div>
        {metadata?.description && (
          <CardDescription className="mt-2">{metadata.description}</CardDescription>
        )}
      </CardContent>
    </Card>
  )
}
