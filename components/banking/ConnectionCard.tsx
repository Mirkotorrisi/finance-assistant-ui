'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { accountTypeFor, consentDaysLeft, consentState, isTradeRepublic, summarizeReport } from '@/lib/banking'
import { formatCurrency, formatDate } from '@/lib/format'
import { useTranslation } from '@/lib/i18n'
import { bankingService } from '@/lib/services/banking.service'
import type { Account } from '@/lib/types/account'
import type { BankAccountLink, BankConnection, SyncReport } from '@/lib/types/banking'

interface Props {
  connection: BankConnection
  accounts: Account[]
  onChanged: () => void
  onAccountsChanged: () => void
}

const CREATE = '__create__'
const NONE = ''

function statusVariant(status: BankConnection['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default'
  if (status === 'expired') return 'secondary'
  return 'destructive'
}

export function ConnectionCard({ connection, accounts, onChanged, onAccountsChanged }: Props) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<SyncReport | null>(null)

  const consent = consentState(connection.valid_until)
  const daysLeft = consentDaysLeft(connection.valid_until)
  const needsRenewal = consent === 'expired' || consent === 'expiring' || connection.status !== 'active'

  const run = async (what: string, fn: () => Promise<void>) => {
    setBusy(what)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('banking.card.error'))
    } finally {
      setBusy(null)
    }
  }

  const sync = () =>
    run('sync', async () => {
      const reports = await bankingService.sync(connection.id)
      const mine = reports.find((r) => r.connection_id === connection.id) ?? reports[0] ?? null
      setReport(mine)
      if (mine && mine.accounts.some((a) => a.transactions_added > 0 || a.balance_recorded)) {
        window.dispatchEvent(new Event('transactions-updated'))
      }
      onChanged()
    })

  const renew = () =>
    run('renew', async () => {
      const res = await bankingService.connect(connection.aspsp_name, connection.aspsp_country, connection.id)
      window.location.href = res.url
    })

  const forget = () => {
    if (!window.confirm(t('banking.card.forgetConfirm', { bank: connection.aspsp_name }))) return
    void run('forget', async () => {
      await bankingService.forget(connection.id)
      onChanged()
    })
  }

  const toggle = (field: 'sync_balances' | 'sync_transactions') =>
    run(field, async () => {
      await bankingService.updateConnection(connection.id, { [field]: !connection[field] })
      onChanged()
    })

  const setLinkEnabled = (link: BankAccountLink, enabled: boolean) =>
    run(`link-${link.id}`, async () => {
      await bankingService.updateLink(connection.id, link.id, { enabled })
      onChanged()
    })

  const mapLink = (link: BankAccountLink, value: string) =>
    run(`link-${link.id}`, async () => {
      if (value === CREATE) {
        const name = window.prompt(t('banking.card.newAccountPrompt'), link.label ?? connection.aspsp_name)
        if (!name || !name.trim()) return
        await bankingService.updateLink(connection.id, link.id, {
          create_account: { name: name.trim(), account_type: accountTypeFor(link.cash_account_type, link.label) },
        })
        onAccountsChanged()
      } else if (value === NONE) {
        await bankingService.updateLink(connection.id, link.id, { unlink: true })
      } else {
        await bankingService.updateLink(connection.id, link.id, { account_id: Number(value) })
      }
      onChanged()
    })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{connection.aspsp_name}</CardTitle>
          <span className="text-xs text-muted-foreground">{connection.aspsp_country}</span>
          <Badge variant={statusVariant(connection.status)}>{t(`banking.status.${connection.status}`)}</Badge>
          {consent === 'expiring' && daysLeft !== null && (
            <Badge variant="outline" className="gap-1 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" /> {t('banking.card.expiring', { n: daysLeft })}
            </Badge>
          )}
          {consent === 'expired' && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> {t('banking.card.expired')}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {connection.valid_until ? t('banking.card.validUntil', { date: formatDate(connection.valid_until) }) : t('banking.card.validUnknown')}
          {' · '}
          {connection.last_sync_at
            ? t('banking.card.lastSync', { date: new Date(connection.last_sync_at).toLocaleString(), status: connection.last_sync_status ?? '' })
            : t('banking.card.neverSynced')}
        </p>
        {connection.last_error && <p className="text-xs text-destructive">{connection.last_error}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={sync} disabled={busy !== null || connection.status !== 'active'} className="gap-1.5">
            {busy === 'sync' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {t('banking.card.syncNow')}
          </Button>
          {needsRenewal && (
            <Button size="sm" variant="outline" onClick={renew} disabled={busy !== null}>
              {busy === 'renew' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('banking.card.renew')}
            </Button>
          )}
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={connection.sync_balances} onChange={() => toggle('sync_balances')} disabled={busy !== null} />
            {t('banking.card.syncBalances')}
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={connection.sync_transactions} onChange={() => toggle('sync_transactions')} disabled={busy !== null} />
            {t('banking.card.syncTransactions')}
          </label>
          <Button size="sm" variant="ghost" onClick={forget} disabled={busy !== null} className="ml-auto gap-1.5 text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> {t('banking.card.forget')}
          </Button>
        </div>
        {busy === 'sync' && <p className="text-xs text-muted-foreground">{t('banking.card.syncing')}</p>}
        {report && <p className="rounded-md bg-muted/50 p-2 text-xs">{summarizeReport(report, t)}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {isTradeRepublic(connection.aspsp_name) && (
          <p className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t('banking.card.tradeRepublicNote')}
          </p>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('banking.card.colAccount')}</TableHead>
              <TableHead>{t('banking.card.colType')}</TableHead>
              <TableHead className="text-right">{t('banking.card.colBalance')}</TableHead>
              <TableHead>{t('banking.card.colMapping')}</TableHead>
              <TableHead>{t('banking.card.colEnabled')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connection.accounts.map((link) => (
              <TableRow key={link.id}>
                <TableCell>
                  <div className="font-medium">{link.label ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{link.iban_masked ?? ''}</div>
                </TableCell>
                <TableCell className="text-xs">
                  {link.cash_account_type ? t(`banking.accountType.${link.cash_account_type}`) : '—'}
                  {link.currency ? ` · ${link.currency}` : ''}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {link.last_balance !== null ? (
                    <>
                      {formatCurrency(link.last_balance, link.currency ?? 'EUR')}
                      <div className="text-xs text-muted-foreground">{formatDate(link.last_balance_date ?? undefined)}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={link.account_id === null ? NONE : String(link.account_id)}
                    onChange={(e) => mapLink(link, e.target.value)}
                    disabled={busy !== null}
                    className="h-8 min-w-40 text-xs"
                    aria-label={t('banking.card.colMapping')}
                  >
                    <option value={NONE}>{t('banking.card.notMapped')}</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name}
                      </option>
                    ))}
                    <option value={CREATE}>{t('banking.card.createAccount')}</option>
                  </Select>
                  {link.account_id === null && <p className="mt-1 text-xs text-muted-foreground">{t('banking.card.notMappedHint')}</p>}
                </TableCell>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={link.enabled}
                    onChange={(e) => setLinkEnabled(link, e.target.checked)}
                    disabled={busy !== null}
                    aria-label={t('banking.card.colEnabled')}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
