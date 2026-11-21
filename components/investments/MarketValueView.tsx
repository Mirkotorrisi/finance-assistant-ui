'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, formatDate, formatSignedCurrency } from '@/lib/format'
import { SERIES_COLORS } from '@/lib/chart-colors'
import { countAtCost, securitiesAccountName, sortAllocation } from '@/lib/portfolio'
import { accountsService } from '@/lib/services/accounts.service'
import { portfolioService } from '@/lib/services/portfolio.service'
import type { Account } from '@/lib/types/account'
import type { BrokerGroup, Instrument, MarketPortfolio, RefreshReport } from '@/lib/types/portfolio'
import { BrokerPositions } from './BrokerPositions'
import { InstrumentsPanel } from './InstrumentsPanel'
import { resultColor } from './InvestmentsView'

const NO_KEY = 'ALPHAVANTAGE_API_KEY is not set'

export function MarketValueView() {
  const { t } = useTranslation()
  const [portfolio, setPortfolio] = useState<MarketPortfolio | null>(null)
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [report, setReport] = useState<RefreshReport | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [showInstruments, setShowInstruments] = useState(false)
  const [editInstrument, setEditInstrument] = useState<number | null>(null)

  const load = useCallback(() => {
    Promise.all([portfolioService.get(), portfolioService.instruments(), accountsService.list()])
      .then(([p, i, a]) => {
        setPortfolio(p)
        setInstruments(i)
        setAccounts(a)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('portfolio.loadError')))
  }, [t])

  useEffect(() => {
    load()
    window.addEventListener('workspace-changed', load)
    return () => window.removeEventListener('workspace-changed', load)
  }, [load])

  const refresh = async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      const out = await portfolioService.refresh()
      setReport(out)
      if (out.valuations && out.valuations.written.length > 0) window.dispatchEvent(new Event('transactions-updated'))
      load()
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : t('portfolio.refreshError'))
    } finally {
      setRefreshing(false)
    }
  }

  const setSecuritiesAccount = async (group: BrokerGroup, value: string) => {
    if (group.source_account_id === null) return
    try {
      if (value === '__new__') {
        const created = await accountsService.create({ name: securitiesAccountName(group.source_account), account_type: 'investment' })
        await accountsService.update(group.source_account_id, { securities_account_id: created.id })
      } else {
        await accountsService.update(group.source_account_id, { securities_account_id: value ? Number(value) : null })
      }
      window.dispatchEvent(new Event('transactions-updated'))
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('portfolio.loadError'))
    }
  }

  const openEditor = (instrumentId: number | null) => {
    setShowInstruments(true)
    setEditInstrument(instrumentId)
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!portfolio) return <div className="h-28 animate-pulse rounded-xl bg-muted" />
  if (portfolio.accounts.length === 0) return null

  const allPositions = portfolio.accounts.flatMap((g) => g.positions)
  const unrealized = portfolio.accounts.reduce((sum, g) => sum + g.unrealized, 0)
  const atCost = countAtCost(allPositions)
  const allocation = sortAllocation(portfolio.allocation)
  const investmentAccounts = accounts.filter((a) => ['investment', 'brokerage', 'retirement', 'pension', 'crypto'].includes(a.type))
  const noKey = report?.prices.skipped === NO_KEY

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{t('portfolio.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('portfolio.asOf', { date: formatDate(portfolio.as_of) })}</p>
            </div>
            <Button size="sm" onClick={refresh} disabled={refreshing} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('portfolio.refreshing') : t('portfolio.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label={t('portfolio.totalValue')} value={formatCurrency(portfolio.total_value)} hero />
            <Tile label={t('portfolio.unrealized')} value={formatSignedCurrency(unrealized)} color={resultColor(unrealized)} help={t('portfolio.unrealizedHelp')} />
            <Tile label={t('portfolio.atCost')} value={String(atCost)} help={t('portfolio.atCostHelp')} />
            <Tile label={t('portfolio.unknown')} value={String(portfolio.unknown_positions)} help={t('portfolio.unknownHelp')} />
          </div>

          {refreshing && <p className="text-xs text-muted-foreground">{t('portfolio.refreshSlow')}</p>}
          {refreshError && <p className="text-xs text-destructive">{refreshError}</p>}
          {report && !refreshing && (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
              {noKey ? (
                <p className="text-amber-700 dark:text-amber-400">{t('portfolio.noKey')}</p>
              ) : (
                <ul className="space-y-0.5">
                  <li>{t('portfolio.reportUpdated', { n: report.prices.updated.length, requests: report.prices.requests })}{report.prices.updated.length > 0 && `: ${report.prices.updated.join(', ')}`}</li>
                  {report.prices.stopped && <li className="text-amber-700 dark:text-amber-400">{t('portfolio.reportStopped', { reason: report.prices.stopped })}</li>}
                  {(report.prices.errors ?? []).map((e) => (
                    <li key={e.symbol} className="text-destructive">{e.symbol}: {e.error}</li>
                  ))}
                  {report.valuations && <li>{t('portfolio.reportWritten', { n: report.valuations.written.length })}</li>}
                  {report.valuations?.skipped.map((s, i) => (
                    <li key={i} className="text-muted-foreground">{t('portfolio.reportSkipped', { reason: s.reason })}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {allocation.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t('portfolio.allocation')}</p>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {allocation.map((s, i) => (
                  <div key={s.asset_class} style={{ width: `${s.weight}%`, background: SERIES_COLORS[i % SERIES_COLORS.length] }} title={`${t(`portfolio.assetClass.${s.asset_class}`)} ${s.weight}%`} />
                ))}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {allocation.map((s, i) => (
                  <li key={s.asset_class} className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
                    <span>{t(`portfolio.assetClass.${s.asset_class}`)}</span>
                    <span className="text-muted-foreground">{s.weight}% · {formatCurrency(s.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t('portfolio.note')}</p>
        </CardContent>
      </Card>

      {portfolio.accounts.map((group) => (
        <Card key={group.source_account_id ?? 'none'}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{group.source_account ?? t('portfolio.noAccount')}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(group.value)} · {t('portfolio.openCost')} {formatCurrency(group.open_cost)} ·{' '}
                  <span style={{ color: resultColor(group.unrealized) }}>{formatSignedCurrency(group.unrealized)}</span>
                  {group.unknown_positions > 0 && ` · ${t('portfolio.unknownPositions', { n: group.unknown_positions })}`}
                </p>
              </div>
              {group.source_account_id !== null && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  {t('portfolio.securitiesAccount')}
                  <Select
                    value={group.securities_account_id ?? ''}
                    onChange={(e) => setSecuritiesAccount(group, e.target.value)}
                    className="h-8 w-auto min-w-44 text-xs"
                    aria-label={t('portfolio.securitiesAccount')}
                  >
                    <option value="">{t('portfolio.securitiesNone')}</option>
                    {investmentAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                    <option value="__new__">{t('portfolio.securitiesCreate')}</option>
                  </Select>
                </label>
              )}
            </div>
            {group.source_account_id !== null && group.securities_account_id === null && (
              <p className="text-xs text-amber-700 dark:text-amber-400">{t('portfolio.securitiesHint')}</p>
            )}
          </CardHeader>
          <CardContent>
            <BrokerPositions positions={group.positions} onEdit={openEditor} />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setShowInstruments((v) => !v)}>
            <CardTitle className="text-base">{t('portfolio.instruments.title')}</CardTitle>
            {showInstruments ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <p className="text-sm text-muted-foreground">{t('portfolio.instruments.subtitle')}</p>
        </CardHeader>
        {showInstruments && (
          <CardContent>
            <InstrumentsPanel instruments={instruments} highlight={editInstrument} onChanged={load} />
          </CardContent>
        )}
      </Card>
      <Badge variant="outline" className="hidden" />
    </div>
  )
}

function Tile({ label, value, help, color, hero }: { label: string; value: string; help?: string; color?: string; hero?: boolean }) {
  return (
    <div className={`rounded-xl border border-border/60 p-4 ${hero ? 'col-span-2 lg:col-span-1' : ''}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-nowrap text-xl font-bold tracking-tight tabular-nums" style={color ? { color } : undefined}>{value}</p>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  )
}
