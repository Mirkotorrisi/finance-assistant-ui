export interface TopCategory {
  category: string
  amount: number
  count: number
}

export interface MonthlySummary {
  month: string
  income: number
  expenses: number
  net: number
  top_categories: TopCategory[]
}

export interface DistributionItem {
  name: string
  amount: number
  percent: number
  count: number
}

export interface SpendingDistribution {
  start_date: string
  end_date: string
  group_by: string
  total_amount: number
  distribution: DistributionItem[]
}

export interface TypeBreakdownItem {
  amount: number
  percent: number
}

export interface AccountBreakdownItem {
  account_id: number
  name: string
  type: string
  category: string
  balance: number
  percent: number
  currency: string
}

export interface AccountBreakdown {
  total_balance: number
  by_type: Record<string, TypeBreakdownItem>
  accounts: AccountBreakdownItem[]
}

export interface SpendingDistributionParams {
  start_date: string
  end_date: string
  group_by?: string
}
