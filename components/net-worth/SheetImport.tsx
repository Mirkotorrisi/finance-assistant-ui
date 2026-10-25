'use client'

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import { accountsService } from '@/lib/services/accounts.service'
import { netWorthService } from '@/lib/services/net-worth.service'
import { buildFlowRows, buildSnapshots, guessAccountType, matchAccount } from '@/lib/net-worth'
import type { FlowCheckRow, NetWorthAccount, SheetPreview } from '@/lib/types/net-worth'

const SKIP = 'skip'
const NEW = 'new'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: NetWorthAccount[]
  onImported: () => void
}

interface Outcome {
  saved: number
  gaps: number
  mismatches: FlowCheckRow[]
  checked: number
}

export function SheetImport({ open, onOpenChange, accounts, onImported }: Props) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [sheet, setSheet] = useState<SheetPreview | null>(null)
  const [year, setYear] = useState('')
  const [columns, setColumns] = useState<Record<string, string>>({})
  const [flowChoice, setFlowChoice] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts])

  function reset() {
    setFile(null)
    setSheet(null)
    setColumns({})
    setFlowChoice({})
    setError(null)
    setOutcome(null)
  }

  async function read() {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const parsed = await netWorthService.readSheet(file)
      setSheet(parsed)
      setYear(String(parsed.year))
      const byColumn: Record<string, string> = {}
      for (const column of parsed.balances) {
        const match = matchAccount(column.name, accounts)
        byColumn[column.name] = match ? String(match.id) : NEW
      }
      setColumns(byColumn)
      const byFlow: Record<string, string> = {}
      for (const flow of parsed.flows) {
        const match = matchAccount(flow.label, accounts)
        byFlow[flow.label] = match ? String(match.id) : SKIP
      }
      setFlowChoice(byFlow)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('netWorth.sheet.failed'))
    } finally {
      setBusy(false)
    }
  }

  const chosen = Object.values(columns).filter((v) => v !== SKIP).length
  const yearNumber = Number(year)
  const monthsCount = sheet ? new Set(sheet.balances.flatMap((b) => Object.keys(b.values))).size : 0
  const snapshotCount = sheet
    ? sheet.balances.filter((b) => (columns[b.name] ?? SKIP) !== SKIP).reduce((n, b) => n + Object.keys(b.values).length, 0)
    : 0

  async function run() {
    if (!sheet || !Number.isInteger(yearNumber)) return
    setBusy(true)
    setError(null)
    try {
      // new accounts first, so every column has an id
      const accountByColumn: Record<string, number | undefined> = {}
      for (const column of sheet.balances) {
        const choice = columns[column.name]
        if (choice === NEW) {
          const created = await accountsService.create({ name: column.name, account_type: guessAccountType(column.name) })
          accountByColumn[column.name] = created.id
        } else if (choice && choice !== SKIP) {
          accountByColumn[column.name] = Number(choice)
        }
      }
      const snapshots = buildSnapshots(sheet, yearNumber, accountByColumn)
      const saved = await netWorthService.recordMany(snapshots)

      const accountByFlow: Record<string, number | undefined> = {}
      for (const [label, choice] of Object.entries(flowChoice)) {
        if (choice !== SKIP) accountByFlow[label] = Number(choice)
      }
      const flowRows = buildFlowRows(sheet, yearNumber, accountByFlow)
      const checked = flowRows.length ? await netWorthService.checkFlows(flowRows) : []
      setOutcome({ saved: saved.saved, gaps: saved.gaps, checked: checked.length, mismatches: checked.filter((r) => r.status === 'mismatch') })
      window.dispatchEvent(new Event('transactions-updated'))
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('netWorth.sheet.failed'))
    } finally {
      setBusy(false)
    }
  }

  const label = (id: number) => accountName.get(id) ?? String(id)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('netWorth.sheet.title')}</DialogTitle>
          <DialogDescription>{t('netWorth.sheet.description')}</DialogDescription>
        </DialogHeader>

        {outcome ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              {t('netWorth.sheet.done', { saved: outcome.saved, gaps: outcome.gaps })}
            </p>
            {outcome.checked > 0 && outcome.mismatches.length === 0 && (
              <p className="text-muted-foreground">{t('netWorth.sheet.flowOk')}</p>
            )}
            {outcome.mismatches.length > 0 && (
              <div className="space-y-1">
                <p className="font-medium">{t('netWorth.sheet.flowMismatch')}</p>
                <ul className="max-h-56 space-y-1 overflow-y-auto text-muted-foreground">
                  {outcome.mismatches.flatMap((r) => {
                    const lines: string[] = []
                    if (r.income_diff !== null && Math.abs(r.income_diff) > 1)
                      lines.push(t('netWorth.sheet.flowLine', { month: r.month, account: label(r.account_id), what: t('netWorth.sheet.flowIncome'), declared: formatCurrency(r.declared_income ?? 0), actual: formatCurrency(r.actual_income) }))
                    if (r.expenses_diff !== null && Math.abs(r.expenses_diff) > 1)
                      lines.push(t('netWorth.sheet.flowLine', { month: r.month, account: label(r.account_id), what: t('netWorth.sheet.flowExpenses'), declared: formatCurrency(r.declared_expenses ?? 0), actual: formatCurrency(r.actual_expenses) }))
                    return lines.map((line) => <li key={`${r.month}-${r.account_id}-${line}`}>{line}</li>)
                  })}
                </ul>
              </div>
            )}
            <Button onClick={() => { onOpenChange(false); reset() }}>{t('netWorth.sheet.close')}</Button>
          </div>
        ) : !sheet ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sheet-file">{t('netWorth.sheet.file')}</Label>
              <Input
                id="sheet-file"
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null) }}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={!file || busy} onClick={read}>
              {busy ? t('netWorth.sheet.reading') : t('netWorth.sheet.read')}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-end gap-3">
              <div className="w-28 space-y-1.5">
                <Label htmlFor="sheet-year">{t('netWorth.sheet.year')}</Label>
                <Input id="sheet-year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <p className="pb-2 text-sm text-muted-foreground">{t('netWorth.sheet.months', { n: monthsCount })}</p>
            </div>

            {sheet.balances.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">{t('netWorth.sheet.balances')}</h3>
                <p className="text-xs text-muted-foreground">{t('netWorth.sheet.balancesHelp')}</p>
                {sheet.balances.map((column) => (
                  <div key={column.name} className="grid grid-cols-[1fr_1.2fr] items-center gap-3">
                    <span className="truncate text-sm font-medium">{column.name}</span>
                    <Select
                      aria-label={column.name}
                      value={columns[column.name] ?? SKIP}
                      onChange={(e) => setColumns((c) => ({ ...c, [column.name]: e.target.value }))}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                      <option value={NEW}>{t('netWorth.sheet.createNew', { name: column.name })}</option>
                      <option value={SKIP}>{t('netWorth.sheet.skip')}</option>
                    </Select>
                  </div>
                ))}
                {sheet.notes.length > 0 && (
                  <p className="text-xs text-muted-foreground">{t('netWorth.sheet.notes', { n: sheet.notes.length })}</p>
                )}
              </section>
            )}

            {sheet.flows.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">{t('netWorth.sheet.flows')}</h3>
                <p className="text-xs text-muted-foreground">{t('netWorth.sheet.flowsHelp')}</p>
                {sheet.flows.map((flow) => (
                  <div key={flow.label} className="grid grid-cols-[1fr_1.2fr] items-center gap-3">
                    <span className="truncate text-sm font-medium">{flow.label}</span>
                    <Select
                      aria-label={flow.label}
                      value={flowChoice[flow.label] ?? SKIP}
                      onChange={(e) => setFlowChoice((c) => ({ ...c, [flow.label]: e.target.value }))}
                    >
                      <option value={SKIP}>{t('netWorth.sheet.flowSkip')}</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </section>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {chosen === 0 && <p className="text-xs text-muted-foreground">{t('netWorth.sheet.nothing')}</p>}
            <Button disabled={busy || chosen === 0 || !Number.isInteger(yearNumber)} onClick={run}>
              {busy ? t('netWorth.sheet.importing') : t('netWorth.sheet.import', { n: snapshotCount })}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
