import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyData, FlowMode } from '@/types/finance';
import { Button } from '@/components/ui/button';

interface ExpensesIncomeSectionProps {
  monthlyData: MonthlyData[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: MonthlyData;
  }>;
  mode: FlowMode;
}

const CustomTooltip = ({ active, payload, mode }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MonthlyData;
    const value = data[mode];

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-1">{data.month}</p>
        <p className="text-sm font-medium">{formatCurrency(Math.abs(value))}</p>
      </div>
    );
  }
  return null;
};

export function ExpensesIncomeSection({
  monthlyData,
}: ExpensesIncomeSectionProps) {
  const [mode, setMode] = useState<FlowMode>('expenses');

  const getBarColor = () => {
    switch (mode) {
      case 'expenses':
        return 'hsl(0, 70%, 65%)'; // Soft red
      case 'income':
        return 'hsl(142, 70%, 55%)'; // Soft green
      case 'net':
        return 'hsl(var(--chart-1))'; // Dynamic color
    }
  };

  const getDataKey = () => {
    return mode;
  };

  // Calculate insights
  const calculateInsights = () => {
    const expenses = monthlyData.map((d) => d.expenses);
    const income = monthlyData.map((d) => d.income);
    const net = monthlyData.map((d) => d.net);

    const avgExpenses = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const avgIncome = income.reduce((a, b) => a + b, 0) / income.length;
    const avgNet = net.reduce((a, b) => a + b, 0) / net.length;
    const maxExpenseMonth = monthlyData[expenses.indexOf(Math.max(...expenses))];
    const maxIncomeMonth = monthlyData[income.indexOf(Math.max(...income))];

    return {
      avgExpenses,
      avgIncome,
      avgNet,
      maxExpenseMonth,
      maxIncomeMonth,
    };
  };

  const insights = calculateInsights();

  return (
    <div className="px-4 py-6">
      {/* Section Title */}
      <h2 className="text-2xl font-bold mb-4">Expenses & Income</h2>
      <p className="text-sm text-muted-foreground mb-6">
        How money moves every month
      </p>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={mode === 'expenses' ? 'default' : 'outline'}
          onClick={() => setMode('expenses')}
          className="flex-1 min-w-[100px]"
        >
          Expenses
        </Button>
        <Button
          variant={mode === 'income' ? 'default' : 'outline'}
          onClick={() => setMode('income')}
          className="flex-1 min-w-[100px]"
        >
          Income
        </Button>
        <Button
          variant={mode === 'net' ? 'default' : 'outline'}
          onClick={() => setMode('net')}
          className="flex-1 min-w-[100px]"
        >
          Net
        </Button>
      </div>

      {/* Chart */}
      <div className="w-full h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${(Math.abs(value) / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} />
            <Bar
              dataKey={getDataKey()}
              fill={getBarColor()}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold mb-3">Insights</h3>

        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Highest spending:</span>{' '}
            {insights.maxExpenseMonth.month} with{' '}
            {formatCurrency(insights.maxExpenseMonth.expenses)}
          </p>

          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Highest income:</span>{' '}
            {insights.maxIncomeMonth.month} with{' '}
            {formatCurrency(insights.maxIncomeMonth.income)}
          </p>

          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Average monthly expense:</span>{' '}
            {formatCurrency(insights.avgExpenses)}
          </p>

          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Average monthly income:</span>{' '}
            {formatCurrency(insights.avgIncome)}
          </p>

          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Average monthly net savings:</span>{' '}
            <span
              className={
                insights.avgNet >= 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }
            >
              {formatCurrency(insights.avgNet)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
