'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { categoryColor } from '@/lib/chart-colors'
import { transactionsService } from '@/lib/services/transactions.service'
import { formatCurrency, formatDate } from '@/lib/format'
import { CategoryEditor } from '@/components/finance/CategoryEditor'
import { TransactionSearch } from '@/components/finance/TransactionSearch'
import type { Transaction, TransactionFilters } from '@/lib/types/transaction'
import { useTranslation } from '@/lib/i18n'

const PAGE_SIZE = 50

interface TransactionsTableProps {
  title?: string
  params?: TransactionFilters
}

export function TransactionsTable({ title, params }: TransactionsTableProps) {
  const { t } = useTranslation()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [limit, setLimit] = useState(PAGE_SIZE)

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1)
    window.addEventListener('transactions-updated', refresh)
    return () => window.removeEventListener('transactions-updated', refresh)
  }, [])

  useEffect(() => {
    transactionsService.getCategories().then(setCategories).catch(() => {})
  }, [refreshKey])

  useEffect(() => {
    setLoading(true)
    setError(null)
    setLimit(PAGE_SIZE)
    transactionsService
      .list(params)
      .then(setTransactions)
      .catch((err) => setError(err instanceof Error ? err.message : t('transactions.error')))
      .finally(() => setLoading(false))
  }, [params, refreshKey, t])

  const toggleCategory = (category: string) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const filteredTransactions = transactions.filter((tx) => !hiddenCategories.has(tx.category))
  const visibleTransactions = filteredTransactions.slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? t('transactions.defaultTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => {
              const active = !hiddenCategories.has(cat)
              const color = categoryColor(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors select-none ${
                    active
                      ? 'border-border bg-background text-foreground hover:bg-muted'
                      : 'border-transparent bg-transparent text-muted-foreground/60 line-through hover:bg-muted'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ background: color, opacity: active ? 1 : 0.35 }}
                  />
                  {transactions.find((tx) => tx.category === cat)?.category_label ?? cat}
                </button>
              )
            })}
          </div>
        )}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : visibleTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('transactions.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('transactions.headers.date')}</TableHead>
                  <TableHead>{t('transactions.headers.description')}</TableHead>
                  <TableHead>{t('transactions.headers.category')}</TableHead>
                  <TableHead className="text-right">{t('transactions.headers.amount')}</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatDate(tx.date)}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      <CategoryEditor
                        transaction={tx}
                        onUpdated={(updated) =>
                          setTransactions((prev) =>
                            prev.map((t) => (t.id === updated.id ? updated : t))
                          )
                        }
                      />
                    </TableCell>
                    <TableCell
                      className="text-right font-medium whitespace-nowrap tabular-nums"
                      style={{ color: tx.amount >= 0 ? 'oklch(0.62 0.19 162)' : 'oklch(0.64 0.25 16)' }}
                    >
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="pl-2">
                      <TransactionSearch description={tx.description} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{t('transactions.shown', { shown: visibleTransactions.length, total: filteredTransactions.length })}</span>
              {filteredTransactions.length > limit && (
                <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                  {t('transactions.showMore', { n: Math.min(PAGE_SIZE, filteredTransactions.length - limit) })}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
