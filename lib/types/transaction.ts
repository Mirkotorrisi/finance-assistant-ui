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
  /** The blueprint's label for the category (the stored value is its stable key). */
  category_label?: string | null
  /** Who decided the category: user, rule, file, ai, fallback or legacy. */
  category_source?: string
  /** Confidence of an AI-chosen category (0-1). */
  confidence?: number | null
  /** True once the user (or a rule they made) confirmed the category. */
  reviewed?: boolean
  merchant_key?: string | null
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
