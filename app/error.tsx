'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="p-6 max-w-md">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Something went wrong</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={reset} className="w-full">
          Try again
        </Button>
      </Card>
    </div>
  )
}
