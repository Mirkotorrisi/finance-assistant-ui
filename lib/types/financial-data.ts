export interface MonthlyDataPoint {
  month: string
  income: number
  expenses: number
  net: number
  savings_rate: number
}

export interface FinancialDataResponse {
  year: number
  total_income: number
  total_expenses: number
  net_savings: number
  savings_rate: number
  monthly_data: MonthlyDataPoint[]
}
