/**
 * Bank connections: the gateway drives the bank API (consent, sync), the finance API stores the state.
 */

import { del, get, post, put } from './http'
import { scopeHeaders } from '@/lib/workspace'
import type {
  Aspsp,
  BankAccountLink,
  BankConnection,
  BankingStatus,
  ConnectResponse,
  SuspectAction,
  SuspectDuplicate,
  SyncReport,
} from '@/lib/types/banking'

const GATEWAY_URL =
  (typeof window === 'undefined' ? process.env.LLM_API_BASE_URL : process.env.NEXT_PUBLIC_LLM_API_BASE_URL) ??
  'http://localhost:8000'

async function gateway<T>(method: string, path: string, body?: unknown, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${GATEWAY_URL}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...scopeHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const detail = (data as { detail?: unknown })?.detail
    throw new Error(typeof detail === 'string' ? detail : `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const bankingService = {
  // ── gateway ──────────────────────────────────────────────────────────────
  status(): Promise<BankingStatus> {
    return gateway<BankingStatus>('GET', '/banking/status')
  },
  aspsps(country: string, q?: string): Promise<Aspsp[]> {
    return gateway<{ aspsps: Aspsp[] }>('GET', '/banking/aspsps', undefined, { country, q }).then((r) => r.aspsps)
  },
  connect(aspspName: string, country: string, connectionId?: number): Promise<ConnectResponse> {
    return gateway<ConnectResponse>('POST', '/banking/connect', {
      aspsp_name: aspspName,
      country,
      psu_type: 'personal',
      connection_id: connectionId,
    })
  },
  pasteCallback(input: { url?: string; code?: string; state?: string }): Promise<BankConnection> {
    return gateway<BankConnection>('POST', '/banking/callback', input)
  },
  sync(connectionId?: number): Promise<SyncReport[]> {
    return gateway<{ reports: SyncReport[] }>('POST', '/banking/sync', connectionId === undefined ? {} : { connection_id: connectionId }).then(
      (r) => r.reports,
    )
  },
  forget(connectionId: number): Promise<{ message: string }> {
    return gateway<{ message: string }>('DELETE', `/banking/connections/${connectionId}`)
  },

  // ── finance API ──────────────────────────────────────────────────────────
  list(): Promise<BankConnection[]> {
    return get<BankConnection[]>('/api/bank-connections')
  },
  updateConnection(id: number, changes: { sync_balances?: boolean; sync_transactions?: boolean }): Promise<BankConnection> {
    return put<BankConnection>(`/api/bank-connections/${id}`, changes)
  },
  updateLink(
    connectionId: number,
    linkId: number,
    changes: { account_id?: number; unlink?: boolean; create_account?: { name: string; account_type: string }; enabled?: boolean },
  ): Promise<BankAccountLink> {
    return put<BankAccountLink>(`/api/bank-connections/${connectionId}/links/${linkId}`, changes)
  },
  suspects(): Promise<SuspectDuplicate[]> {
    return get<SuspectDuplicate[]>('/api/imports/suspects')
  },
  resolveSuspect(transactionId: number, action: SuspectAction): Promise<{ resolved: number; action: string }> {
    return post<{ resolved: number; action: string }>(`/api/imports/suspects/${transactionId}/resolve`, { action })
  },
  deleteConnectionRecord(id: number): Promise<{ message: string }> {
    return del(`/api/bank-connections/${id}`)
  },
}
