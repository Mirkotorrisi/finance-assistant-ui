/**
 * Net worth service – maps to /api/net-worth and /api/balance-snapshots, plus the gateway's sheet reader.
 */

import { del, get, post } from './http'
import { scopeHeaders } from '@/lib/workspace'
import type {
  BalanceSnapshot,
  FlowCheckInput,
  FlowCheckRow,
  NetWorth,
  SheetPreview,
  SnapshotInput,
} from '@/lib/types/net-worth'

const LLM_BASE_URL = process.env.NEXT_PUBLIC_LLM_API_BASE_URL ?? 'http://localhost:8000'

export const netWorthService = {
  /** GET /api/net-worth – month-end balance per account, liquid / invested / total */
  get(): Promise<NetWorth> {
    return get<NetWorth>('/api/net-worth')
  },

  /** GET /api/balance-snapshots – snapshots with their reconciliation against the transactions */
  snapshots(): Promise<BalanceSnapshot[]> {
    return get<{ snapshots: BalanceSnapshot[] }>('/api/balance-snapshots').then((r) => r.snapshots)
  },

  /** POST /api/balance-snapshots – create or replace the snapshot of an account on a day */
  record(input: SnapshotInput): Promise<BalanceSnapshot> {
    return post<BalanceSnapshot>('/api/balance-snapshots', input)
  },

  /** POST /api/balance-snapshots/bulk */
  recordMany(snapshots: SnapshotInput[]): Promise<{ saved: number; gaps: number }> {
    return post('/api/balance-snapshots/bulk', { snapshots, source: 'import' })
  },

  /** DELETE /api/balance-snapshots/:id */
  remove(id: number): Promise<{ message: string }> {
    return del(`/api/balance-snapshots/${id}`)
  },

  /** POST /api/balance-snapshots/:id/adjust – book the unexplained difference as a correcting transaction */
  adjust(id: number): Promise<unknown> {
    return post(`/api/balance-snapshots/${id}/adjust`, {})
  },

  /** POST /api/net-worth/check-flows – the sheet's income/expenses against the transactions */
  checkFlows(rows: FlowCheckInput[]): Promise<FlowCheckRow[]> {
    return post<{ rows: FlowCheckRow[] }>('/api/net-worth/check-flows', { rows }).then((r) => r.rows)
  },

  /** POST {gateway}/statements/balance-sheet – read a monthly sheet (nothing is stored) */
  async readSheet(file: File): Promise<SheetPreview> {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`${LLM_BASE_URL}/statements/balance-sheet`, { method: 'POST', body, headers: scopeHeaders() })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(typeof err?.detail === 'string' ? err.detail : `HTTP ${res.status}`)
    }
    return res.json() as Promise<SheetPreview>
  },
}
