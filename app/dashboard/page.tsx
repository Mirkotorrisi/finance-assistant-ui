'use client'

import { useState } from 'react'
import { SummaryCards } from '@/components/finance/SummaryCards'
import { TransactionsTable } from '@/components/finance/TransactionsTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TransactionFilters } from '@/lib/types/transaction'

const EMPTY_FILTERS: TransactionFilters = {
  category: undefined,
  start_date: undefined,
  end_date: undefined,
}

export default function DashboardPage() {
  const [draft, setDraft] = useState<TransactionFilters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<TransactionFilters>(EMPTY_FILTERS)

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    // strip empty strings so the service doesn't send empty query params
    setApplied({
      category: draft.category || undefined,
      start_date: draft.start_date || undefined,
      end_date: draft.end_date || undefined,
    })
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
  }

  const hasActiveFilters =
    applied.category || applied.start_date || applied.end_date

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your finances and all transactions.
        </p>
      </div>

      {/* Summary cards */}
      <SummaryCards />

      {/* Transactions section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Transactions</h2>
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              Filters active
            </span>
          )}
        </div>

        {/* Filter bar */}
        <form
          onSubmit={handleApply}
          className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
        >
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. groceries"
              value={draft.category ?? ''}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-44"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="start_date">From</Label>
            <Input
              id="start_date"
              type="date"
              value={draft.start_date ?? ''}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, start_date: e.target.value }))
              }
              className="w-40"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="end_date">To</Label>
            <Input
              id="end_date"
              type="date"
              value={draft.end_date ?? ''}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, end_date: e.target.value }))
              }
              className="w-40"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Apply</Button>
            {hasActiveFilters && (
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </form>

        {/* Table — re-fetches automatically when applied changes */}
        <TransactionsTable params={applied} />
      </div>
    </div>
  )
}
