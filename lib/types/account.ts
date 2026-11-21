export interface AccountCreate {
  name: string
  account_type: string
  currency?: string
  is_active?: boolean
  current_balance?: number
}

export interface AccountUpdate {
  name?: string
  type?: string
  is_active?: boolean
  /** the investment account whose value the trades booked on this cash account build (null = none) */
  securities_account_id?: number | null
}

export interface Account {
  id: number
  name: string
  type: string
  currency: string
  is_active: boolean
  current_balance: number
  /** what current_balance rests on: snapshot | derived | carried | transactions | none */
  balance_basis?: string
  securities_account_id?: number | null
}

export interface AccountBalanceResponse {
  account_id: number
  balance: number
}
