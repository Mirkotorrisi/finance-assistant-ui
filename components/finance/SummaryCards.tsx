'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { transactionsService } from '@/lib/services/transactions.service'
import { accountsService } from '@/lib/services/accounts.service'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { formatCurrency } from '@/lib/format'
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

// OKLCH values matching chart-2 (green) and chart-5 (red) tokens
const GREEN = 'oklch(0.62 0.19 162)'
const RED   = 'oklch(0.64 0.25 16)'

interface SummaryData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
}

interface SummaryCardsProps {
  title?: string
}

export function SummaryCards({ title }: SummaryCardsProps) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [monthLabel, setMonthLabel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const now = new Date()
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        setMonthLabel(now.toLocaleString('en-US', { month: 'long', year: 'numeric' }))

        const [balanceRes, monthlySummary, accounts] = await Promise.all([
          transactionsService.getBalance(),
          financialSummaryService.getMonthly(month),
          accountsService.list(true),
        ])

        const totalAccountBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0)

        setData({
          totalBalance: totalAccountBalance || balanceRes.balance,
          monthlyIncome: monthlySummary.income,
          monthlyExpenses: Math.abs(monthlySummary.expenses),
          monthlyNet: monthlySummary.net,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load summary data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-3 bg-muted rounded w-3/4 mb-3" />
              <div className="h-7 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
      </Card>
    )
  }

  if (!data) return null

  const isNetPositive = data.monthlyNet >= 0

  const cards = [
    {
      label: 'Total Balance',
      subtitle: null,
      value: formatCurrency(data.totalBalance),
      icon: Wallet,
      cardStyle: {
        background: 'color-mix(in oklch, var(--primary) 6%, var(--background))',
        borderColor: 'color-mix(in oklch, var(--primary) 20%, transparent)',
      },
      iconStyle: { color: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 12%, transparent)' },
      valueStyle: { color: 'var(--primary)' },
    },
    {
      label: 'Monthly Income',
      subtitle: monthLabel,
      value: formatCurrency(data.monthlyIncome),
      icon: TrendingUp,
      cardStyle: {
        background: `color-mix(in oklch, ${GREEN} 6%, var(--background))`,
        borderColor: `color-mix(in oklch, ${GREEN} 20%, transparent)`,
      },
      iconStyle: { color: GREEN, background: `color-mix(in oklch, ${GREEN} 12%, transparent)` },
      valueStyle: { color: GREEN },
    },
    {
      label: 'Monthly Expenses',
      subtitle: monthLabel,
      value: formatCurrency(data.monthlyExpenses),
      icon: CreditCard,
      cardStyle: {
        background: `color-mix(in oklch, ${RED} 6%, var(--background))`,
        borderColor: `color-mix(in oklch, ${RED} 20%, transparent)`,
      },
      iconStyle: { color: RED, background: `color-mix(in oklch, ${RED} 12%, transparent)` },
      valueStyle: { color: RED },
    },
    {
      label: 'Monthly Net',
      subtitle: monthLabel,
      value: formatCurrency(data.monthlyNet),
      icon: isNetPositive ? TrendingUp : TrendingDown,
      cardStyle: {
        background: `color-mix(in oklch, ${isNetPositive ? GREEN : RED} 6%, var(--background))`,
        borderColor: `color-mix(in oklch, ${isNetPositive ? GREEN : RED} 20%, transparent)`,
      },
      iconStyle: {
        color: isNetPositive ? GREEN : RED,
        background: `color-mix(in oklch, ${isNetPositive ? GREEN : RED} 12%, transparent)`,
      },
      valueStyle: { color: isNetPositive ? GREEN : RED },
    },
  ]

  return (
    <div>
      {title && <h3 className="text-base font-semibold mb-3">{title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="border" style={card.cardStyle}>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                    style={card.iconStyle}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-2xl font-bold tracking-tight" style={card.valueStyle}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
