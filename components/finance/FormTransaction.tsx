'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { transactionsService } from '@/lib/services/transactions.service'
import type { TransactionCreate } from '@/lib/types/transaction'

interface FormTransactionProps {
  title?: string
  onSuccess?: () => void
}

const DEFAULT_FORM: TransactionCreate = {
  amount: 0,
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  currency: 'EUR',
  account_id: undefined,
}

export function FormTransaction({ title = 'Add Transaction', onSuccess }: FormTransactionProps) {
  const [form, setForm] = useState<TransactionCreate>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleChange(field: keyof TransactionCreate, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await transactionsService.create(form)
      setSuccess(true)
      setForm(DEFAULT_FORM)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="amount">Amount (negative = expense)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="e.g. groceries"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g. Weekly supermarket"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                placeholder="EUR"
                maxLength={3}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600">Transaction created successfully!</p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Saving…' : 'Save Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
