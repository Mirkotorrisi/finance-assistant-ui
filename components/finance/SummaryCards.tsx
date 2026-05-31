'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { transactionsService } from '@/lib/services/transactions.service'
import { accountsService } from '@/lib/services/accounts.service'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { formatCurrency } from '@/lib/format'
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const now = new Date()
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

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
      value: formatCurrency(data.totalBalance),
      icon: Wallet,
      cardClass: 'bg-gradient-to-br from-primary/8 to-primary/4 border-primary/20',
      iconClass: 'text-primary bg-primary/10',
      valueClass: 'text-primary',
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(data.monthlyIncome),
      icon: TrendingUp,
      cardClass: 'bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-emerald-200/50',
      iconClass: 'text-emerald-600 bg-emerald-100/80',
      valueClass: 'text-emerald-700',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(data.monthlyExpenses),
      icon: CreditCard,
      cardClass: 'bg-gradient-to-br from-rose-50 to-rose-100/40 border-rose-200/50',
      iconClass: 'text-rose-600 bg-rose-100/80',
      valueClass: 'text-rose-700',
    },
    {
      label: 'Monthly Net',
      value: formatCurrency(data.monthlyNet),
      icon: isNetPositive ? TrendingUp : TrendingDown,
      cardClass: isNetPositive
        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-emerald-200/50'
        : 'bg-gradient-to-br from-rose-50 to-rose-100/40 border-rose-200/50',
      iconClass: isNetPositive
        ? 'text-emerald-600 bg-emerald-100/80'
        : 'text-rose-600 bg-rose-100/80',
      valueClass: isNetPositive ? 'text-emerald-700' : 'text-rose-700',
    },
  ]

  return (
    <div>
      {title && <h3 className="text-base font-semibold mb-3">{title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className={cn("border", card.cardClass)}>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", card.iconClass)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className={cn("text-2xl font-bold tracking-tight", card.valueClass)}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
