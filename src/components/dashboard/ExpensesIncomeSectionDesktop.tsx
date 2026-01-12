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
import { formatCurrency } from '@/lib/format';

interface ExpensesIncomeSectionDesktopProps {
  monthlyData: MonthlyData[];
}

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
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
        <p className="font-semibold mb-2 text-base">{data.month}</p>
        <p className="text-base font-medium">{formatCurrency(Math.abs(value))}</p>
      </div>
    );
  }
  return null;
};

export function ExpensesIncomeSectionDesktop({
  monthlyData,
}: ExpensesIncomeSectionDesktopProps) {
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
    <div className="px-8 py-8">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Expenses & Income</h2>
        <p className="text-base text-muted-foreground">
          How money moves every month
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(350px,400px)] gap-8">
        {/* Left Column: Chart */}
        <div>
          {/* Mode Toggle */}
          <div className="flex gap-3 mb-6">
            <Button
              variant={mode === 'expenses' ? 'default' : 'outline'}
              onClick={() => setMode('expenses')}
              size="lg"
              className="flex-1"
            >
              Expenses
            </Button>
            <Button
              variant={mode === 'income' ? 'default' : 'outline'}
              onClick={() => setMode('income')}
              size="lg"
              className="flex-1"
            >
              Income
            </Button>
            <Button
              variant={mode === 'net' ? 'default' : 'outline'}
              onClick={() => setMode('net')}
              size="lg"
              className="flex-1"
            >
              Net
            </Button>
          </div>

          {/* Chart */}
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={13}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={13}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `$${(Math.abs(value) / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip content={<CustomTooltip mode={mode} />} />
                <Bar
                  dataKey={getDataKey()}
                  fill={getBarColor()}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Insights Panel */}
        <div>
          <div className="bg-muted/50 rounded-lg p-6 h-full">
            <h3 className="text-xl font-semibold mb-6">Insights</h3>

            <div className="space-y-5">
              {/* Insight Cards */}
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  Highest Spending
                </p>
                <p className="font-semibold text-lg">
                  {insights.maxExpenseMonth.month}
                </p>
                <p className="text-base text-red-600 dark:text-red-500">
                  {formatCurrency(insights.maxExpenseMonth.expenses)}
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  Highest Income
                </p>
                <p className="font-semibold text-lg">
                  {insights.maxIncomeMonth.month}
                </p>
                <p className="text-base text-green-600 dark:text-green-500">
                  {formatCurrency(insights.maxIncomeMonth.income)}
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  Average Monthly Expense
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(insights.avgExpenses)}
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  Average Monthly Income
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(insights.avgIncome)}
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  Average Monthly Net Savings
                </p>
                <p
                  className={`text-lg font-semibold ${
                    insights.avgNet >= 0
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-red-600 dark:text-red-500'
                  }`}
                >
                  {formatCurrency(insights.avgNet)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
