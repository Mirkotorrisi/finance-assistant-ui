export interface MonthlyDataPoint {
  month: string
  netWorth: number
  income: number
  expenses: number
  net: number
}

export interface AccountBreakdown {
  liquidity: number
  investments: number
  otherAssets: number
}

export interface FinancialDataResponse {
  year: number
  currentNetWorth: number
  netSavings: number
  monthlyData: MonthlyDataPoint[]
  accountBreakdown: AccountBreakdown
}
