/** Bank connections (PSD2 via Enable Banking): gateway and API shapes. */

import type { Transaction } from './transaction'

export interface BankingStatus {
  configured: boolean
  app_id_set: boolean
  key_found: boolean
  key_path: string
  redirect_url: string
  sync_mode: string
  sync_interval_hours: number
  consent_days: number
  secrets_dir: string
  scheduler_running: boolean
}

export interface Aspsp {
  name: string
  country: string
  logo: string | null
  beta: boolean
  psu_types: string[]
  max_consent_days: number | null
  required_psu_headers: string[]
}

export interface ConnectResponse {
  url: string
  state: string
  valid_until: string
  redirect_url: string
}

export type CashAccountType = 'CACC' | 'CARD' | 'CASH' | 'LOAN' | 'OTHR' | 'SVGS'
export type ConnectionStatus = 'active' | 'expired' | 'revoked' | 'error'

export interface BankAccountLink {
  id: number
  connection_id: number
  identification_hash: string
  bank_uid: string | null
  iban_masked: string | null
  label: string | null
  currency: string | null
  cash_account_type: CashAccountType | null
  account_id: number | null
  enabled: boolean
  last_transaction_date: string | null
  last_balance: number | null
  last_balance_date: string | null
}

export interface BankConnection {
  id: number
  provider: string
  aspsp_name: string
  aspsp_country: string
  psu_type: string
  session_ref: string
  status: ConnectionStatus
  valid_until: string | null
  sync_balances: boolean
  sync_transactions: boolean
  last_sync_at: string | null
  last_sync_status: string | null
  last_error: string | null
  created_at: string | null
  accounts: BankAccountLink[]
}

export interface AccountSyncReport {
  link_id: number
  account_id: number | null
  balance_recorded: boolean
  transactions_fetched: number
  transactions_added: number
  transactions_skipped: number
  suspect_duplicates: number
  without_description: number
  error: string | null
}

export type SyncStatus = 'ok' | 'partial' | 'error' | 'expired' | 'rate_limited' | 'skipped'

export interface SyncReport {
  connection_id: number
  workspace_id: number
  status: SyncStatus
  error: string | null
  accounts: AccountSyncReport[]
}

export interface BankTransaction extends Transaction {
  source?: 'statement' | 'bank' | 'manual'
  external_id?: string | null
  duplicate_of?: number | null
}

export interface SuspectDuplicate {
  transaction: BankTransaction
  twin: BankTransaction
}

export type SuspectAction = 'keep_both' | 'delete_this' | 'delete_twin'
