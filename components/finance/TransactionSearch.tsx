'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { llmService } from '@/lib/services/llm.service'

interface TransactionSearchProps {
  description: string
}

export function TransactionSearch({ description }: TransactionSearchProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOpen() {
    setOpen(true)
    if (result) return
    setLoading(true)
    setError(null)
    try {
      const text = await llmService.searchTransaction(description)
      setResult(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={handleOpen}
        title="Search web for this transaction"
      >
        <Search className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">What is this?</DialogTitle>
            <DialogDescription className="truncate">{description}</DialogDescription>
          </DialogHeader>

          <div className="py-2 text-sm leading-relaxed">
            {loading && (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/5" />
              </div>
            )}
            {error && <p className="text-destructive">{error}</p>}
            {result && <p className="text-foreground/90">{result}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
