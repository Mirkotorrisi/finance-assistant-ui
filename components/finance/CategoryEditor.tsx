'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { categoryColor } from '@/lib/chart-colors'
import { transactionsService } from '@/lib/services/transactions.service'
import { merchantRulesService } from '@/lib/services/merchant-rules.service'
import type { Transaction } from '@/lib/types/transaction'

interface CategoryEditorProps {
  transaction: Transaction
  onUpdated: (updatedTx: Transaction) => void
}

type Step = 'select' | 'confirm'

export function CategoryEditor({ transaction, onUpdated }: CategoryEditorProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('select')
  const [categories, setCategories] = useState<string[]>([])
  const [selected, setSelected] = useState(transaction.category)
  const [newCategory, setNewCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const newInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStep('select')
      setSelected(transaction.category)
      setNewCategory('')
      transactionsService.getCategories().then(setCategories).catch(() => {})
    }
  }, [open, transaction.category])

  const resolvedCategory = newCategory.trim() || selected

  function handleApply() {
    if (!resolvedCategory || resolvedCategory === transaction.category) {
      setOpen(false)
      return
    }
    setStep('confirm')
  }

  async function handleSingleUpdate() {
    setSaving(true)
    try {
      const updated = await transactionsService.update(transaction.id, { category: resolvedCategory })
      onUpdated(updated)
      window.dispatchEvent(new Event('transactions-updated'))
    } finally {
      setSaving(false)
      setOpen(false)
    }
  }

  async function handleBulkUpdate() {
    setSaving(true)
    try {
      await merchantRulesService.recategorize(transaction.description, resolvedCategory)
      window.dispatchEvent(new Event('transactions-updated'))
    } finally {
      setSaving(false)
      setOpen(false)
    }
  }

  const color = categoryColor(transaction.category)

  return (
    <>
      <Badge
        variant="outline"
        className="cursor-pointer hover:opacity-80 transition-opacity"
        style={{
          color,
          borderColor: `color-mix(in oklch, ${color} 35%, transparent)`,
          background: `color-mix(in oklch, ${color} 10%, var(--background))`,
        }}
        onClick={() => setOpen(true)}
        title="Click to edit category"
      >
        {transaction.category}
      </Badge>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          {step === 'select' ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Change the category for &ldquo;{transaction.description}&rdquo;
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-select">Existing categories</Label>
                  <Select
                    id="cat-select"
                    value={selected}
                    onChange={(e) => {
                      setSelected(e.target.value)
                      setNewCategory('')
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cat-new">Or create new category</Label>
                  <Input
                    id="cat-new"
                    ref={newInputRef}
                    placeholder="e.g. Entertainment"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>

                {resolvedCategory && resolvedCategory !== transaction.category && (
                  <p className="text-xs text-muted-foreground">
                    Will change to:{' '}
                    <span className="font-medium text-foreground">{resolvedCategory}</span>
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={!resolvedCategory || resolvedCategory === transaction.category}
                >
                  Apply
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Apply to all similar?</DialogTitle>
                <DialogDescription>
                  Do you want to apply{' '}
                  <span className="font-medium text-foreground">{resolvedCategory}</span> to{' '}
                  <span className="font-medium text-foreground">all</span> transactions named
                  &ldquo;{transaction.description}&rdquo;, or just this one?
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleSingleUpdate} disabled={saving}>
                  Just this one
                </Button>
                <Button onClick={handleBulkUpdate} disabled={saving}>
                  {saving ? 'Saving…' : 'Apply to all'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
