import type { FinancialData } from '@/types/finance';

// Mock data for 2024
export const mockFinancialData: FinancialData = {
  year: 2024,
  currentNetWorth: 45800,
  netSavings: 8200,
  monthlyData: [
    {
      month: 'Jan',
      netWorth: 38000,
      expenses: 2800,
      income: 4500,
      net: 1700,
    },
    {
      month: 'Feb',
      netWorth: 39200,
      expenses: 2600,
      income: 3800,
      net: 1200,
    },
    {
      month: 'Mar',
      netWorth: 40100,
      expenses: 3200,
      income: 4100,
      net: 900,
    },
    {
      month: 'Apr',
      netWorth: 41000,
      expenses: 2900,
      income: 3800,
      net: 900,
    },
    {
      month: 'May',
      netWorth: 41800,
      expenses: 3100,
      income: 3900,
      net: 800,
    },
    {
      month: 'Jun',
      netWorth: 42500,
      expenses: 2700,
      income: 3400,
      net: 700,
    },
    {
      month: 'Jul',
      netWorth: 43200,
      expenses: 3000,
      income: 4000,
      net: 1000,
    },
    {
      month: 'Aug',
      netWorth: 43900,
      expenses: 2800,
      income: 3500,
      net: 700,
    },
    {
      month: 'Sep',
      netWorth: 44600,
      expenses: 2900,
      income: 3600,
      net: 700,
    },
    {
      month: 'Oct',
      netWorth: 45300,
      expenses: 3100,
      income: 3800,
      net: 700,
    },
    {
      month: 'Nov',
      netWorth: 45800,
      expenses: 2800,
      income: 3300,
      net: 500,
    },
    {
      month: 'Dec',
      netWorth: 45800,
      expenses: 3500,
      income: 3500,
      net: 0,
    },
  ],
  accountBreakdown: {
    liquidity: 25000,
    investments: 18500,
    otherAssets: 2300,
  },
};
