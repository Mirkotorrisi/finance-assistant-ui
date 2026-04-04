export interface TopCategory {
  category: string
  total: number
  percentage: number
}

export interface MonthlySummary {
  month: string
  income: number
  expenses: number
  net: number
  top_categories: TopCategory[]
}

export interface DistributionItem {
  label: string
  total: number
  percentage: number
}

export interface SpendingDistribution {
  start_date: string
  end_date: string
  group_by: string
  items: DistributionItem[]
}

export interface AccountBreakdownItem {
  account_id: number
  account_name: string
  account_type: string
  balance: number
  currency: string
}

export interface AccountBreakdown {
  total_balance: number
  accounts: AccountBreakdownItem[]
}

export interface SpendingDistributionParams {
  start_date: string
  end_date: string
  group_by?: string
}
