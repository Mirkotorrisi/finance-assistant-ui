'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { ConnectBank } from '@/components/banking/ConnectBank'
import { ConnectionCard } from '@/components/banking/ConnectionCard'
import { SetupCard } from '@/components/banking/SetupCard'
import { SuspectsPanel } from '@/components/banking/SuspectsPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/lib/i18n'
import { accountsService } from '@/lib/services/accounts.service'
import { bankingService } from '@/lib/services/banking.service'
import type { Account } from '@/lib/types/account'
import type { BankConnection, BankingStatus, SuspectDuplicate } from '@/lib/types/banking'

export function BanksView() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<BankingStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [connections, setConnections] = useState<BankConnection[] | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [suspects, setSuspects] = useState<SuspectDuplicate[]>([])
  const [banner, setBanner] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const loadStatus = useCallback(() => {
    bankingService
      .status()
      .then((s) => {
        setStatus(s)
        setStatusError(null)
      })
      .catch((err) => setStatusError(err instanceof Error ? err.message : t('banking.gatewayDown')))
  }, [t])

  const loadConnections = useCallback(() => {
    bankingService.list().then(setConnections).catch(() => setConnections([]))
    bankingService.suspects().then(setSuspects).catch(() => setSuspects([]))
  }, [])

  const loadAccounts = useCallback(() => {
    accountsService.list().then(setAccounts).catch(() => setAccounts([]))
  }, [])

  useEffect(() => {
    loadStatus()
    loadConnections()
    loadAccounts()
    const refresh = () => {
      loadConnections()
      loadAccounts()
    }
    window.addEventListener('workspace-changed', refresh)
    window.addEventListener('transactions-updated', loadConnections)
    return () => {
      window.removeEventListener('workspace-changed', refresh)
      window.removeEventListener('transactions-updated', loadConnections)
    }
  }, [loadStatus, loadConnections, loadAccounts])

  // the bank sends the browser back here with ?connected= or ?error=
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (!connected && !error) return
    setBanner(connected ? { kind: 'ok', text: t('banking.connected') } : { kind: 'error', text: t('banking.connectError', { reason: error ?? '' }) })
    router.replace(pathname)
  }, [searchParams, router, pathname, t])

  return (
    <div className="space-y-6">
      {banner && (
        <div
          className={
            banner.kind === 'ok'
              ? 'flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300'
              : 'flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'
          }
        >
          {banner.kind === 'ok' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="flex-1">{banner.text}</span>
          <button type="button" className="text-xs underline" onClick={() => setBanner(null)}>
            {t('banking.dismiss')}
          </button>
        </div>
      )}

      {statusError && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {t('banking.gatewayDown')} ({statusError})
        </p>
      )}

      {status === null && !statusError && <Skeleton className="h-24 w-full" />}
      {status && !status.configured && <SetupCard status={status} />}
      {status?.configured && <ConnectBank onConnected={loadConnections} />}

      <SuspectsPanel suspects={suspects} onResolved={loadConnections} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('banking.connections')}</h2>
        {connections === null ? (
          <Skeleton className="h-32 w-full" />
        ) : connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('banking.noConnections')}</p>
        ) : (
          connections.map((c) => (
            <ConnectionCard key={c.id} connection={c} accounts={accounts} onChanged={loadConnections} onAccountsChanged={loadAccounts} />
          ))
        )}
      </section>
    </div>
  )
}
