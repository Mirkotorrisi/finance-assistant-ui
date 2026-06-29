'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, FileText, Upload } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

interface JobStatus {
  status: 'processing' | 'complete' | 'error'
  step?: 'queued' | 'extracting' | 'parsing' | 'saving'
  completed_chunks?: number
  total_chunks?: number
  result?: UploadResult
  error?: string
}

interface UploadResult {
  transactions_processed: number
  transactions_added: number
  transactions_skipped: number
  message: string
}

const LLM_API_BASE_URL = process.env.NEXT_PUBLIC_LLM_API_BASE_URL ?? 'http://localhost:8000'

export function StatementUpload() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setState('idle')
    setResult(null)
    setError(null)
    setJobStatus(null)
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startPolling(jobId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${LLM_API_BASE_URL}/statements/jobs/${jobId}`)
        if (!res.ok) return
        const job: JobStatus = await res.json()
        setJobStatus(job)

        if (job.status === 'complete') {
          stopPolling()
          setResult(job.result ?? null)
          setState('success')
          window.dispatchEvent(new Event('transactions-updated'))
        } else if (job.status === 'error') {
          stopPolling()
          setError(job.error ?? t('upload.processingFailed'))
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

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${LLM_API_BASE_URL}/statements/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? `Upload failed (HTTP ${res.status})`)
      }

      const { job_id } = await res.json()
      setState('processing')
      startPolling(job_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('upload.uploadFailed'))
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

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) handleReset()
  }

  const progressPercent = (() => {
    if (!jobStatus) return 0
    const { step, completed_chunks = 0, total_chunks = 0 } = jobStatus
    if (step === 'queued') return 5
    if (step === 'extracting') return 15
    if (step === 'parsing') {
      if (total_chunks === 0) return 20
      return 20 + Math.round((completed_chunks / total_chunks) * 65)
    }
    if (step === 'saving') return 90
    return 0
  })()

  const stepLabel = jobStatus?.step
    ? (t(`upload.steps.${jobStatus.step}`) || t('upload.processing'))
    : t('upload.uploading')

  const isProcessing = state === 'uploading' || state === 'processing'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          {t('upload.button')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('upload.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('upload.description')}
          </p>

          {/* Drop zone / file picker */}
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
                  {(file.size / 1024).toFixed(0)} {t('upload.clickToChange')}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('upload.selectFile')}</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.csv,.xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </button>

          {/* Progress bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stepLabel}</span>
                {state === 'processing' && jobStatus?.step === 'parsing' && (jobStatus.total_chunks ?? 0) > 0 && (
                  <span>{jobStatus.completed_chunks}/{jobStatus.total_chunks} {t('upload.chunk')}</span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: state === 'uploading' ? '8%' : `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {state === 'success' && result && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <span className="font-medium text-green-700">{t('upload.importSuccess')}</span>
              </div>
              <ul className="text-sm text-green-700 space-y-0.5 ml-6 list-disc">
                <li>{t('upload.transactionsFound', { n: result.transactions_processed })}</li>
                <li>{t('upload.transactionsAdded', { n: result.transactions_added })}</li>
                {result.transactions_skipped > 0 && (
                  <li>{t('upload.duplicatesSkipped', { n: result.transactions_skipped })}</li>
                )}
              </ul>
            </div>
          )}

          {/* Error */}
          {state === 'error' && error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {state === 'success' ? (
              <>
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  {t('upload.uploadAnother')}
                </Button>
                <Button className="flex-1" onClick={() => setOpen(false)}>
                  {t('common.done')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={isProcessing}
                >
                  {t('upload.cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!file || isProcessing}
                >
                  {isProcessing ? t('upload.processing') : t('upload.upload')}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
