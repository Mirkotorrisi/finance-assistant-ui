'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { transactionsService } from '@/lib/services/transactions.service'
import { accountsService } from '@/lib/services/accounts.service'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { formatCurrency } from '@/lib/format'
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'

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
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
      </Card>
    )
  }

  if (!data) return null

  const cards = [
    {
      label: 'Total Balance',
      value: formatCurrency(data.totalBalance),
      icon: Wallet,
      color: 'text-blue-600',
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(data.monthlyIncome),
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(data.monthlyExpenses),
      icon: CreditCard,
      color: 'text-red-600',
    },
    {
      label: 'Monthly Net',
      value: formatCurrency(data.monthlyNet),
      icon: data.monthlyNet >= 0 ? TrendingUp : TrendingDown,
      color: data.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ]

  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
