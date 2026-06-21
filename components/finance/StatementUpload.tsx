'use client'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, FileText, Upload } from 'lucide-react'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  transactions_processed: number
  transactions_added: number
  transactions_skipped: number
  message: string
}

const LLM_API_BASE_URL = process.env.NEXT_PUBLIC_LLM_API_BASE_URL ?? 'http://localhost:8000'

export function StatementUpload() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setState('idle')
    setResult(null)
    setError(null)
  }

  async function handleUpload() {
    if (!file) return
    setState('uploading')
    setError(null)

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

      const data: UploadResult = await res.json()
      setResult(data)
      setState('success')
      window.dispatchEvent(new Event('transactions-updated'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setState('error')
    }
  }

  function handleReset() {
    setFile(null)
    setState('idle')
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) handleReset()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Statement
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Supported formats: PDF, CSV, XLS, XLSX (max 10 MB). Transactions are
            automatically categorised and deduplicated before being saved.
          </p>

          {/* Drop zone / file picker */}
          <button
            type="button"
            className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => inputRef.current?.click()}
            disabled={state === 'uploading'}
          >
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(0)} KB — click to change
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Click to select a file</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.csv,.xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </button>

          {/* Success */}
          {state === 'success' && result && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <span className="font-medium text-green-700">Import successful</span>
              </div>
              <ul className="text-sm text-green-700 space-y-0.5 ml-6 list-disc">
                <li>{result.transactions_processed} transactions found in file</li>
                <li>{result.transactions_added} transactions added to your account</li>
                {result.transactions_skipped > 0 && (
                  <li>{result.transactions_skipped} duplicates skipped</li>
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
                  Upload Another
                </Button>
                <Button className="flex-1" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={state === 'uploading'}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!file || state === 'uploading'}
                >
                  {state === 'uploading' ? 'Processing…' : 'Upload'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
