export interface MonthlyData {
  month: string;
  netWorth: number;
  expenses: number;
  income: number;
  net: number;
}

export interface AccountBreakdown {
  liquidity: number;
  investments: number;
  otherAssets: number;
}

export interface FinancialData {
  year: number;
  currentNetWorth: number;
  netSavings: number;
  monthlyData: MonthlyData[];
  accountBreakdown: AccountBreakdown;
}

export type FlowMode = 'expenses' | 'income' | 'net';
