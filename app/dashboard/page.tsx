'use client'

import { useState } from 'react'
import { SummaryCards } from '@/components/finance/SummaryCards'
import { TransactionsTable } from '@/components/finance/TransactionsTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SlidersHorizontal, X } from 'lucide-react'
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
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your financial activity
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Summary cards */}
        <SummaryCards />

        {/* Transactions section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Transactions</h2>
              {hasActiveFilters && (
                <p className="text-xs text-primary mt-0.5">Filters active</p>
              )}
            </div>
          </div>

          {/* Filter bar */}
          <form
            onSubmit={handleApply}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1 self-center mb-0.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </div>

            <div className="space-y-1">
              <Label htmlFor="category" className="text-xs text-muted-foreground">Category</Label>
              <Input
                id="category"
                placeholder="e.g. groceries"
                value={draft.category ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-44 h-9 rounded-lg text-sm bg-background/80"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="start_date" className="text-xs text-muted-foreground">From</Label>
              <Input
                id="start_date"
                type="date"
                value={draft.start_date ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, start_date: e.target.value }))
                }
                className="w-40 h-9 rounded-lg text-sm bg-background/80"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="end_date" className="text-xs text-muted-foreground">To</Label>
              <Input
                id="end_date"
                type="date"
                value={draft.end_date ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="w-40 h-9 rounded-lg text-sm bg-background/80"
              />
            </div>

            <div className="flex gap-2 pb-0.5">
              <Button type="submit" size="sm" className="rounded-lg">Apply</Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg gap-1.5"
                  onClick={handleReset}
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </form>

          <TransactionsTable params={applied} />
        </div>
      </div>
    </div>
  )
}
