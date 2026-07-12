'use client'

import { useEffect, useRef, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, FileText, PackageSearch } from 'lucide-react'
import { amazonService } from '@/lib/services/amazon.service'
import { categoryColor } from '@/lib/chart-colors'
import { formatCurrency, formatDate } from '@/lib/format'
import type { AmazonJobStatus, AmazonUploadResult } from '@/lib/types/amazon'
import { useTranslation } from '@/lib/i18n'

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

const STEP_PROGRESS: Record<string, number> = {
  queued: 5,
  parsing_csv: 20,
  matching: 45,
  categorizing: 75,
  saving: 90,
}

export default function AmazonImportPage() {
  const { t } = useTranslation()
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<AmazonUploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<AmazonJobStatus | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setState('idle')
    setResult(null)
    setError(null)
    setJobStatus(null)
  }

  function startPolling(jobId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const job = await amazonService.getJobStatus(jobId)
        setJobStatus(job)

        if (job.status === 'complete') {
          stopPolling()
          setResult(job.result ?? null)
          setState('success')
          window.dispatchEvent(new Event('transactions-updated'))
        } else if (job.status === 'error') {
          stopPolling()
          setError(job.error ?? t('amazonImport.processingFailed'))
          setState('error')
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 1500)
  }

  async function handleUpload() {
    if (!file) return
    setState('uploading')
    setError(null)
    setJobStatus(null)

    try {
      const { job_id } = await amazonService.upload(file)
      setState('processing')
      startPolling(job_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('amazonImport.uploadFailed'))
      setState('error')
    }
  }

  function handleReset() {
    stopPolling()
    setFile(null)
    setState('idle')
    setResult(null)
    setError(null)
    setJobStatus(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const progressPercent = jobStatus?.step ? STEP_PROGRESS[jobStatus.step] ?? 0 : 0
  const stepLabel = jobStatus?.step
    ? (t(`amazonImport.steps.${jobStatus.step}`) || t('amazonImport.processing'))
    : t('amazonImport.uploading')
  const isProcessing = state === 'uploading' || state === 'processing'

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('amazonImport.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('amazonImport.subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{t('amazonImport.description')}</p>

            <button
              type="button"
              className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              {file ? (
                <>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(0)} {t('amazonImport.clickToChange')}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('amazonImport.selectFile')}</p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stepLabel}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: state === 'uploading' ? '8%' : `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {state === 'success' && result && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="font-medium text-green-700">{t('amazonImport.resultTitle')}</span>
                </div>
                <ul className="text-sm text-green-700 space-y-0.5 ml-6 list-disc">
                  <li>{t('amazonImport.ordersParsed', { n: result.orders_parsed })}</li>
                  <li>{t('amazonImport.ordersMatched', { n: result.orders_matched })}</li>
                  <li>{t('amazonImport.transactionsUpdated', { n: result.transactions_updated })}</li>
                </ul>
              </div>
            )}

            {state === 'error' && error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              {state === 'success' ? (
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  {t('amazonImport.uploadAnother')}
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleUpload} disabled={!file || isProcessing}>
                  {isProcessing ? t('amazonImport.processing') : t('amazonImport.upload')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {result && result.updated_transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('amazonImport.updatedTableTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('amazonImport.headers.products')}</TableHead>
                      <TableHead>{t('amazonImport.headers.oldCategory')}</TableHead>
                      <TableHead>{t('amazonImport.headers.newCategory')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.updated_transactions.map((tx) => (
                      <TableRow key={tx.transaction_id}>
                        <TableCell className="max-w-xs truncate" title={tx.products.join(', ')}>
                          {tx.products.join(', ')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              color: categoryColor(tx.old_category),
                              borderColor: `color-mix(in oklch, ${categoryColor(tx.old_category)} 35%, transparent)`,
                              background: `color-mix(in oklch, ${categoryColor(tx.old_category)} 10%, var(--background))`,
                            }}
                          >
                            {tx.old_category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              color: categoryColor(tx.new_category),
                              borderColor: `color-mix(in oklch, ${categoryColor(tx.new_category)} 35%, transparent)`,
                              background: `color-mix(in oklch, ${categoryColor(tx.new_category)} 10%, var(--background))`,
                            }}
                          >
                            {tx.new_category}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {result && result.unmatched_orders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageSearch className="h-4 w-4 text-muted-foreground" />
                {t('amazonImport.unmatchedTableTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('amazonImport.headers.date')}</TableHead>
                      <TableHead>{t('amazonImport.headers.products')}</TableHead>
                      <TableHead className="text-right">{t('amazonImport.headers.amount')}</TableHead>
                      <TableHead>{t('amazonImport.headers.reason')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.unmatched_orders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell className="whitespace-nowrap">{formatDate(order.order_date)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={order.products.join(', ')}>
                          {order.products.join(', ')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t(`amazonImport.reasons.${order.reason}`)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
