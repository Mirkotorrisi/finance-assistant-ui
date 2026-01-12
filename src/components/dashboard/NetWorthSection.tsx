import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MonthlyData, AccountBreakdown } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

interface NetWorthSectionProps {
  monthlyData: MonthlyData[];
  accountBreakdown: AccountBreakdown;
}

interface ChartDataPoint extends MonthlyData {
  monthlyData: MonthlyData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const index = data.monthlyData?.findIndex((d: MonthlyData) => d.month === data.month) ?? -1;
    const prevValue = index > 0 ? data.monthlyData[index - 1].netWorth : null;
    const diff = prevValue ? data.netWorth - prevValue : null;

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-1">{data.month}</p>
        <p className="text-sm font-medium">
          {formatCurrency(data.netWorth)}
        </p>
        {diff !== null && (
          <p
            className={`text-xs mt-1 ${
              diff >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
            }`}
          >
            {diff >= 0 ? '+' : ''}
            {formatCurrency(diff)} vs prev month
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function NetWorthSection({
  monthlyData,
  accountBreakdown,
}: NetWorthSectionProps) {
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);

  // Add monthlyData to each data point for tooltip
  const chartData = monthlyData.map((d) => ({ ...d, monthlyData }));

  return (
    <div className="px-4 py-6">
      {/* Section Title */}
      <h2 className="text-2xl font-bold mb-4">Overall Net Worth</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Total amount of money owned over time
      </p>

      {/* Chart */}
      <div className="w-full h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fill="url(#netWorthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Section */}
      <div className="border border-border rounded-lg">
        <Button
          variant="ghost"
          onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-accent"
        >
          <span className="font-medium">Account Breakdown</span>
          {isBreakdownExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>

        {isBreakdownExpanded && (
          <div className="p-4 pt-0 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Liquidity</span>
              <span className="font-semibold">
                {formatCurrency(accountBreakdown.liquidity)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Investments</span>
              <span className="font-semibold">
                {formatCurrency(accountBreakdown.investments)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Other Assets</span>
              <span className="font-semibold">
                {formatCurrency(accountBreakdown.otherAssets)}
              </span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="font-bold text-lg">
                {formatCurrency(
                  accountBreakdown.liquidity +
                    accountBreakdown.investments +
                    accountBreakdown.otherAssets
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
