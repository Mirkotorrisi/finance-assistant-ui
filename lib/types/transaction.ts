export interface TransactionCreate {
  amount: number
  category: string
  description: string
  date?: string
  currency?: string
  account_id?: number
}

export interface TransactionUpdate {
  amount?: number
  category?: string
  description?: string
  date?: string
  currency?: string
  account_id?: number
}

export interface Transaction {
  id: number
  date: string
  amount: number
  category: string
  description: string
  currency: string
  account_id: number | null
}

export interface BalanceResponse {
  balance: number
}

export interface TransactionFilters {
  category?: string
  start_date?: string
  end_date?: string
  account_id?: number
}
