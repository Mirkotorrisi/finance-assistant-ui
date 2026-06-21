'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { transactionsService } from '@/lib/services/transactions.service'
import { formatCurrency, formatDate } from '@/lib/format'
import { categoryColor } from '@/lib/chart-colors'
import type { Transaction, TransactionFilters } from '@/lib/types/transaction'

interface TransactionsTableProps {
  title?: string
  params?: TransactionFilters
}

export function TransactionsTable({ title = 'Transactions', params }: TransactionsTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1)
    window.addEventListener('transactions-updated', refresh)
    return () => window.removeEventListener('transactions-updated', refresh)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    transactionsService
      .list(params)
      .then(setTransactions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load transactions'))
      .finally(() => setLoading(false))
  }, [params, refreshKey])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          color: categoryColor(tx.category),
                          borderColor: `color-mix(in oklch, ${categoryColor(tx.category)} 35%, transparent)`,
                          background: `color-mix(in oklch, ${categoryColor(tx.category)} 10%, var(--background))`,
                        }}
                      >
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right font-medium"
                      style={{ color: tx.amount >= 0 ? 'oklch(0.62 0.19 162)' : 'oklch(0.64 0.25 16)' }}
                    >
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
