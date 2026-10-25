'use client'

import { useCallback, useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, FileSpreadsheet, Info, Plus } from 'lucide-react'
import { SnapshotForm } from '@/components/net-worth/SnapshotForm'
import { SheetImport } from '@/components/net-worth/SheetImport'
import { resultColor } from '@/components/investments/InvestmentsView'
import { netWorthService } from '@/lib/services/net-worth.service'
import { investmentsService } from '@/lib/services/investments.service'
import { formatCompact, formatCurrency, formatSignedCurrency } from '@/lib/format'
import { SERIES_COLORS } from '@/lib/chart-colors'
import { useTranslation } from '@/lib/i18n'
import type { BalanceSnapshot, NetWorth } from '@/lib/types/net-worth'
import type { Portfolio } from '@/lib/types/investments'

const SNAPSHOT_ROWS = 12

export function NetWorthView() {
  const { t, tr } = useTranslation()
  const [data, setData] = useState<NetWorth | null>(null)
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [importing, setImporting] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(() => {
    Promise.all([netWorthService.get(), netWorthService.snapshots(), investmentsService.portfolio().catch(() => null)])
      .then(([nw, snaps, pf]) => {
        setData(nw)
        setSnapshots(snaps)
        setPortfolio(pf)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('netWorth.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    load()
    const events = ['transactions-updated', 'workspace-changed', 'blueprint-saved']
    events.forEach((e) => window.addEventListener(e, load))
    return () => events.forEach((e) => window.removeEventListener(e, load))
  }, [load])

  async function act(id: number, action: () => Promise<unknown>) {
    setBusyId(id)
    try {
      await action()
      window.dispatchEvent(new Event('transactions-updated'))
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('netWorth.loadError'))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }
  if (error && !data) return <p className="text-sm text-destructive">{error}</p>
  if (!data) return null

  const accounts = data.accounts
  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => setRecording(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        {t('netWorth.record')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
        <FileSpreadsheet className="mr-1.5 h-4 w-4" />
        {t('netWorth.importSheet')}
      </Button>
    </div>
  )
  const dialogs = (
  <>
      <SnapshotForm open={recording} onOpenChange={setRecording} accounts={accounts} onSaved={load} />
      <SheetImport open={importing} onOpenChange={setImporting} accounts={accounts} onImported={load} />
    </>
  )

  // the dialogs sit in the same place in both layouts, so an import that fills the page does not remount them
  if (snapshots.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <h2 className="text-base font-semibold">{t('netWorth.emptyTitle')}</h2>
            <p className="max-w-xl text-sm text-muted-foreground">{t('netWorth.emptyBody')}</p>
            {actions}
          </CardContent>
        </Card>
        {dialogs}
      </>
    )
  }

  const latest = data.latest
  const label = (month: string) =>
    new Date(`${month}-01T12:00:00`).toLocaleDateString(tr.summary.localeCode, { month: 'short', year: '2-digit' })
  const months = data.months.map((m) => ({ ...m, label: label(m.month) }))
  const gaps = snapshots.filter((s) => s.reconciliation.status === 'gap')
  const hasValuation = accounts.some((a) => a.kind === 'valuation')

  const tiles = [
    { label: t('netWorth.total'), value: formatCurrency(latest?.total ?? 0), hero: true },
    { label: t('netWorth.liquid'), value: formatCurrency(latest?.liquid ?? 0) },
    { label: t('netWorth.invested'), value: formatCurrency(latest?.invested ?? 0) },
    {
      label: t('netWorth.change'),
      value: data.change === null ? '—' : formatSignedCurrency(data.change),
      color: data.change === null ? undefined : resultColor(data.change),
    },
  ]

  // everything put in, held now and taken out: only meaningful when there is a market value to compare
  const totals = portfolio?.totals
  const overall =
    totals && hasValuation && (latest?.invested ?? 0) > 0 && totals.invested > 0
      ? (latest?.invested ?? 0) + totals.proceeds + totals.dividends - totals.invested
      : null

  const statusBadge = (s: BalanceSnapshot) => {
    const r = s.reconciliation
    if (r.status === 'gap')
      return <Badge variant="destructive" className="whitespace-nowrap">{t('netWorth.statusGap', { delta: formatSignedCurrency(r.delta ?? 0) })}</Badge>
    if (r.status === 'ok') return <Badge variant="outline" className="whitespace-nowrap">{t('netWorth.statusOk')}</Badge>
    if (r.status === 'untracked')
      return <Badge variant="outline" className="whitespace-nowrap text-muted-foreground" title={t('netWorth.untrackedHelp')}>{t('netWorth.statusUntracked', { change: formatSignedCurrency(r.change ?? 0) })}</Badge>
    if (r.status === 'valuation')
      return <Badge variant="outline" className="whitespace-nowrap">{t('netWorth.statusValuation', { change: formatSignedCurrency(r.change ?? 0) })}</Badge>
    return <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">{t('netWorth.statusBaseline')}</Badge>
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">{actions}</div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((tile) => (
            <Card key={tile.label} className={tile.hero ? 'col-span-2 lg:col-span-1' : undefined}>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
                <p
                  className="mt-2 whitespace-nowrap text-xl font-bold tracking-tight tabular-nums sm:text-2xl"
                  style={tile.color ? { color: tile.color } : undefined}
                >
                  {tile.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {gaps.length > 0 && (
          <div className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-medium">
                {gaps.length === 1 ? t('netWorth.gapsOne') : t('netWorth.gapsTitle', { n: gaps.length })}
              </p>
              <p className="text-muted-foreground">{t('netWorth.gapsBody')}</p>
            </div>
          </div>
        )}

        {overall !== null && (
          <div className="flex gap-2 rounded-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-medium text-foreground">
                {t('netWorth.result')}: <span style={{ color: resultColor(overall) }}>{formatSignedCurrency(overall)}</span>
              </span>
              {' — '}{t('netWorth.resultHelp')}
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('netWorth.chartTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <AreaChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis width={48} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip
                  formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--popover-foreground)' }}
                  labelStyle={{ color: 'var(--popover-foreground)', fontWeight: 600 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
                />
                <Area type="monotone" dataKey="liquid" name={t('netWorth.liquidSeries')} stackId="nw" stroke={SERIES_COLORS[0]} fill={SERIES_COLORS[0]} fillOpacity={0.35} isAnimationActive={false} />
                <Area type="monotone" dataKey="invested" name={t('netWorth.investedSeries')} stackId="nw" stroke={SERIES_COLORS[2]} fill={SERIES_COLORS[2]} fillOpacity={0.35} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('netWorth.tableTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('netWorth.month')}</TableHead>
                    {accounts.map((a) => (
                      <TableHead key={a.id} className="whitespace-nowrap text-right">{a.name}</TableHead>
                    ))}
                    <TableHead className="text-right">{t('netWorth.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...months].reverse().map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="whitespace-nowrap font-medium">{m.label}</TableCell>
                      {accounts.map((a) => {
                        const cell = m.balances[String(a.id)]
                        const title = {
                          snapshot: t('netWorth.basisSnapshot'),
                          derived: t('netWorth.basisDerived'),
                          carried: t('netWorth.basisCarried'),
                          transactions: t('netWorth.basisTransactions'),
                          none: '',
                        }[cell?.basis ?? 'none']
                        return (
                          <TableCell
                            key={a.id}
                            title={title}
                            className={`whitespace-nowrap text-right tabular-nums ${cell?.basis === 'snapshot' ? '' : 'italic text-muted-foreground'}`}
                          >
                            {cell?.balance === null || cell === undefined ? '—' : formatCurrency(cell.balance)}
                          </TableCell>
                        )
                      })}
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{formatCurrency(m.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t('netWorth.legend')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('netWorth.snapshotsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('netWorth.date')}</TableHead>
                    <TableHead>{t('netWorth.account')}</TableHead>
                    <TableHead className="text-right">{t('netWorth.balance')}</TableHead>
                    <TableHead>{t('netWorth.status')}</TableHead>
                    <TableHead>{t('netWorth.note')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showAll ? [...snapshots].reverse() : [...snapshots].reverse().slice(0, SNAPSHOT_ROWS)).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">{s.date}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.account_name}</TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">{formatCurrency(s.balance)}</TableCell>
                      <TableCell>{statusBadge(s)}</TableCell>
                      <TableCell className="min-w-40 text-sm text-muted-foreground">{s.note}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {s.reconciliation.status === 'gap' && (
                          <Button
                            size="sm"
                            variant="outline"
                            title={t('netWorth.adjustHelp')}
                            disabled={busyId === s.id}
                            onClick={() => act(s.id, () => netWorthService.adjust(s.id))}
                          >
                            {busyId === s.id ? t('netWorth.adjusting') : t('netWorth.adjust')}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === s.id}
                          onClick={() => act(s.id, () => netWorthService.remove(s.id))}
                        >
                          {t('netWorth.delete')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {snapshots.length > SNAPSHOT_ROWS && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAll((v) => !v)}>
                {showAll ? t('netWorth.showLess') : t('netWorth.showAll', { n: snapshots.length })}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      {dialogs}
    </>
  )
}
