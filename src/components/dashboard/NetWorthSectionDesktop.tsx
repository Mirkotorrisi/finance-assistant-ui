import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyData, AccountBreakdown } from '@/types/finance';
import { formatCurrency } from '@/lib/format';

interface NetWorthSectionDesktopProps {
  monthlyData: MonthlyData[];
  accountBreakdown: AccountBreakdown;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: MonthlyData;
  }>;
  monthlyData: MonthlyData[];
}

const CustomTooltip = ({ active, payload, monthlyData }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const index = monthlyData.findIndex((d) => d.month === data.month);
    const prevValue = index > 0 ? monthlyData[index - 1].netWorth : null;
    const diff = prevValue ? data.netWorth - prevValue : null;

    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
        <p className="font-semibold mb-2 text-base">{data.month}</p>
        <p className="text-base font-medium mb-1">
          {formatCurrency(data.netWorth)}
        </p>
        {diff !== null && (
          <p
            className={`text-sm ${
              diff >= 0
                ? 'text-green-600 dark:text-green-500'
                : 'text-red-600 dark:text-red-500'
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

export function NetWorthSectionDesktop({
  monthlyData,
  accountBreakdown,
}: NetWorthSectionDesktopProps) {
  return (
    <div className="px-8 py-8">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Overall Net Worth</h2>
        <p className="text-base text-muted-foreground">
          Total amount of money owned over time
        </p>
      </div>

      {/* Chart - Full Width, Larger */}
      <div className="w-full h-96 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={monthlyData}
            margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip monthlyData={monthlyData} />} />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2.5}
              fill="url(#netWorthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Panel - Persistent Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Account Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* Liquidity Card */}
          <div className="border border-border rounded-lg p-5 bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <p className="text-sm text-muted-foreground mb-2">Liquidity</p>
            <p className="text-2xl font-bold">
              {formatCurrency(accountBreakdown.liquidity)}
            </p>
          </div>

          {/* Investments Card */}
          <div className="border border-border rounded-lg p-5 bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <p className="text-sm text-muted-foreground mb-2">Investments</p>
            <p className="text-2xl font-bold">
              {formatCurrency(accountBreakdown.investments)}
            </p>
          </div>

          {/* Other Assets Card */}
          <div className="border border-border rounded-lg p-5 bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <p className="text-sm text-muted-foreground mb-2">Other Assets</p>
            <p className="text-2xl font-bold">
              {formatCurrency(accountBreakdown.otherAssets)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
