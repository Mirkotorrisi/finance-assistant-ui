'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { COUNTRIES, parseCallbackUrl } from '@/lib/banking'
import { useTranslation } from '@/lib/i18n'
import { bankingService } from '@/lib/services/banking.service'
import type { Aspsp } from '@/lib/types/banking'

interface Props {
  onConnected: () => void
}

export function ConnectBank({ onConnected }: Props) {
  const { t } = useTranslation()
  const [country, setCountry] = useState<string>('IT')
  const [query, setQuery] = useState('')
  const [banks, setBanks] = useState<Aspsp[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState<string | null>(null)
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [pasteState, setPasteState] = useState<'idle' | 'busy' | 'error'>('idle')
  const [pasteError, setPasteError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    bankingService
      .aspsps(country)
      .then((list) => !cancelled && setBanks(list))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : t('banking.connect.loadError')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [country, t])

  const visible = banks.filter((b) => !query || b.name.toLowerCase().includes(query.toLowerCase()))

  const start = async (bank: Aspsp) => {
    setStarting(bank.name)
    setError(null)
    try {
      const res = await bankingService.connect(bank.name, bank.country)
      window.location.href = res.url
    } catch (err) {
      setError(err instanceof Error ? err.message : t('banking.connect.startError'))
      setStarting(null)
    }
  }

  const submitPaste = async () => {
    const parsed = parseCallbackUrl(pasted)
    if (!parsed || parsed.error || (!parsed.code && !parsed.state)) {
      setPasteState('error')
      setPasteError(parsed?.error ?? t('banking.connect.pasteInvalid'))
      return
    }
    setPasteState('busy')
    try {
      await bankingService.pasteCallback({ url: pasted.trim() })
      setPasted('')
      setPasteState('idle')
      setFallbackOpen(false)
      onConnected()
    } catch (err) {
      setPasteState('error')
      setPasteError(err instanceof Error ? err.message : t('banking.connect.pasteError'))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('banking.connect.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('banking.connect.hint')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={country} onChange={(e) => setCountry(e.target.value)} className="sm:w-32" aria-label={t('banking.connect.country')}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('banking.connect.search')} className="h-9" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('banking.connect.loading')}
          </p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('banking.connect.none')}</p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-md border border-border">
            {visible.map((bank) => (
              <li key={`${bank.country}-${bank.name}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                {bank.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bank.logo} alt="" className="h-6 w-6 rounded object-contain" />
                ) : (
                  <span className="h-6 w-6 rounded bg-muted" />
                )}
                <span className="flex-1 truncate font-medium">{bank.name}</span>
                {bank.beta && <Badge variant="outline">beta</Badge>}
                {bank.max_consent_days && (
                  <span className="hidden text-xs text-muted-foreground sm:inline">{t('banking.connect.consent', { n: bank.max_consent_days })}</span>
                )}
                <Button size="sm" onClick={() => start(bank)} disabled={starting !== null}>
                  {starting === bank.name ? <Loader2 className="h-4 w-4 animate-spin" /> : t('banking.connect.action')}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setFallbackOpen((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${fallbackOpen ? 'rotate-180' : ''}`} />
          {t('banking.connect.fallbackTitle')}
        </button>
        {fallbackOpen && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t('banking.connect.fallbackHint')}</p>
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="http://127.0.0.1:8000/banking/callback?code=…&state=…"
              className="text-xs"
              rows={2}
            />
            {pasteState === 'error' && <p className="text-xs text-destructive">{pasteError}</p>}
            <Button size="sm" variant="outline" onClick={submitPaste} disabled={pasteState === 'busy' || !pasted.trim()}>
              {pasteState === 'busy' ? t('banking.connect.pasteBusy') : t('banking.connect.pasteAction')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
