'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, formatDate } from '@/lib/format'
import { portfolioService } from '@/lib/services/portfolio.service'
import { ASSET_CLASSES, INSTRUMENT_TYPES, VALUATIONS } from '@/lib/types/portfolio'
import type { AssetClass, Instrument, InstrumentType, InstrumentUpdate, ResolveReport, Valuation } from '@/lib/types/portfolio'

function SymbolInput({ value, onCommit, placeholder }: { value: string; onCommit: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value)
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    setText(value)
  }
  const commit = () => {
    const trimmed = text.trim().toUpperCase()
    if (trimmed && trimmed !== value) onCommit(trimmed)
  }
  return (
    <Input value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} placeholder={placeholder} className="h-8 w-32 text-xs" aria-label={placeholder} />
  )
}

export function InstrumentsPanel({ instruments, highlight, onChanged }: { instruments: Instrument[]; highlight: number | null; onChanged: () => void }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<ResolveReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rowRef = useRef<HTMLTableRowElement | null>(null)

  useEffect(() => {
    if (highlight !== null && rowRef.current) rowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlight, instruments])

  const save = async (id: number, data: InstrumentUpdate) => {
    setError(null)
    try {
      await portfolioService.updateInstrument(id, data)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('portfolio.instruments.error'))
    }
  }

  const resolve = async () => {
    setBusy(true)
    setError(null)
    try {
      setReport(await portfolioService.resolve())
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('portfolio.instruments.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={resolve} disabled={busy} className="gap-1.5">
          <Search className="h-3.5 w-3.5" />
          {busy ? t('portfolio.instruments.resolving') : t('portfolio.instruments.resolve')}
        </Button>
        <span className="text-xs text-muted-foreground">{t('portfolio.instruments.symbolHint')}</span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {report && (
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
          <p>{t('portfolio.instruments.resolveReport', { resolved: report.resolved, unresolved: report.unresolved })}</p>
          {report.error && <p className="text-destructive">{report.error}</p>}
          <ul className="mt-1 space-y-0.5">
            {report.instruments.map((r) => (
              <li key={r.isin}>
                {r.isin} {r.name}: {r.symbol ?? '—'}{r.error && <span className="text-muted-foreground"> ({r.error})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('portfolio.col.instrument')}</TableHead>
              <TableHead>{t('portfolio.instruments.type')}</TableHead>
              <TableHead>{t('portfolio.col.assetClass')}</TableHead>
              <TableHead>{t('portfolio.instruments.valuation')}</TableHead>
              <TableHead>{t('portfolio.instruments.symbol')}</TableHead>
              <TableHead>{t('portfolio.instruments.manual')}</TableHead>
              <TableHead className="text-right">{t('portfolio.instruments.lastPrice')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instruments.map((inst) => (
              <TableRow key={inst.id} ref={inst.id === highlight ? rowRef : undefined} className={inst.id === highlight ? 'bg-amber-500/10' : undefined}>
                <TableCell className="min-w-56">
                  <p className="font-medium">{inst.name}</p>
                  <p className="text-xs text-muted-foreground">{inst.isin ?? inst.key}{inst.last_error && <span className="text-amber-700 dark:text-amber-400"> · {inst.last_error}</span>}</p>
                </TableCell>
                <TableCell>
                  <Select value={inst.type} onChange={(e) => save(inst.id, { type: e.target.value as InstrumentType })} className="h-8 w-auto text-xs" aria-label={t('portfolio.instruments.type')}>
                    {INSTRUMENT_TYPES.map((v) => <option key={v} value={v}>{t(`portfolio.type.${v}`)}</option>)}
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={inst.asset_class} onChange={(e) => save(inst.id, { asset_class: e.target.value as AssetClass })} className="h-8 w-auto text-xs" aria-label={t('portfolio.col.assetClass')}>
                    {ASSET_CLASSES.map((v) => <option key={v} value={v}>{t(`portfolio.assetClass.${v}`)}</option>)}
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={inst.valuation} onChange={(e) => save(inst.id, { valuation: e.target.value as Valuation })} className="h-8 w-auto text-xs" aria-label={t('portfolio.instruments.valuation')}>
                    {VALUATIONS.map((v) => <option key={v} value={v}>{t(`portfolio.valuation.${v}`)}</option>)}
                  </Select>
                </TableCell>
                <TableCell>
                  <SymbolInput value={inst.price_symbol ?? ''} onCommit={(symbol) => save(inst.id, { price_symbol: symbol, valuation: 'market' })} placeholder={t('portfolio.instruments.symbol')} />
                </TableCell>
                <TableCell>
                  {inst.valuation === 'manual' ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.0001"
                        defaultValue={inst.manual_price ?? ''}
                        onBlur={(e) => {
                          const v = Number(e.target.value)
                          if (e.target.value !== '' && Number.isFinite(v) && v !== inst.manual_price) save(inst.id, { manual_price: v, valuation: 'manual' })
                        }}
                        className="h-8 w-24 text-xs"
                        aria-label={t('portfolio.instruments.manual')}
                      />
                      <Input type="date" defaultValue={inst.manual_price_date ?? ''} onBlur={(e) => e.target.value && e.target.value !== inst.manual_price_date && save(inst.id, { manual_price_date: e.target.value })} className="h-8 w-36 text-xs" aria-label={t('portfolio.instruments.manualDate')} />
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                  {inst.last_price ? `${formatCurrency(inst.last_price.close, inst.last_price.currency)} · ${formatDate(inst.last_price.date)}` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
