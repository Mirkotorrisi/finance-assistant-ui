/** Mirrors /api/net-worth, /api/balance-snapshots (finance-assistant-api/src/services/net_worth_service.py)
 *  and POST /statements/balance-sheet (llm-finance-assistant/src/services/balance_sheet.py). */

export type SnapshotStatus = 'baseline' | 'ok' | 'gap' | 'valuation' | 'untracked'

export interface Reconciliation {
  status: SnapshotStatus
  previous_date?: string
  expected_change?: number
  actual_change?: number
  /** what the transactions do not explain (gap) */
  delta?: number
  /** valuation accounts: the change in market value; untracked: the change with nothing to compare it to */
  change?: number
}

export interface BalanceSnapshot {
  id: number
  account_id: number
  account_name: string
  date: string
  balance: number
  source: string
  note: string | null
  reconciliation: Reconciliation
}

export type BalanceBasis = 'snapshot' | 'derived' | 'carried' | 'transactions' | 'none'

export interface NetWorthAccount {
  id: number
  name: string
  type: string
  kind: 'cash' | 'valuation'
}

export interface NetWorthMonth {
  month: string
  date: string
  balances: Record<string, { balance: number | null; basis: BalanceBasis }>
  liquid: number
  invested: number
  total: number
}

export interface NetWorth {
  accounts: NetWorthAccount[]
  months: NetWorthMonth[]
  latest: NetWorthMonth | null
  change: number | null
  unreconciled_snapshots: number
}

export interface SnapshotInput {
  account_id: number
  date: string
  balance: number
  note?: string
}

export interface FlowCheckInput {
  month: string
  account_id: number
  income?: number
  expenses?: number
}

export interface FlowCheckRow {
  month: string
  account_id: number
  declared_income: number | null
  declared_expenses: number | null
  actual_income: number
  actual_expenses: number
  income_diff: number | null
  expenses_diff: number | null
  status: 'ok' | 'mismatch'
}

/** A monthly sheet as read by the gateway: values keyed by month number ("1".."12"). */
export interface SheetBalances {
  name: string
  values: Record<string, number>
}

export interface SheetFlows {
  label: string
  income: Record<string, number>
  expenses: Record<string, number>
}

export interface SheetPreview {
  year: number
  balances: SheetBalances[]
  flows: SheetFlows[]
  notes: { month: number; text: string }[]
}
