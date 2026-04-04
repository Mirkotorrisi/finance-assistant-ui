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
}

export interface Account {
  id: number
  name: string
  type: string
  currency: string
  is_active: boolean
  current_balance: number
}

export interface AccountBalanceResponse {
  account_id: number
  balance: number
}
