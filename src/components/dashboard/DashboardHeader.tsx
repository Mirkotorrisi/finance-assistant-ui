import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  year: number;
  currentNetWorth: number;
  netSavings: number;
  onYearChange: () => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function DashboardHeader({
  year,
  currentNetWorth,
  netSavings,
  onYearChange,
}: DashboardHeaderProps) {
  return (
    <div className="px-4 py-6 bg-background">
      {/* Year Selector */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onYearChange}
          className="flex items-center gap-2 text-lg font-medium"
        >
          <span>{year}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Hero Numbers */}
      <div className="space-y-6">
        {/* Current Net Worth */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Current Net Worth</p>
          <p className="text-4xl font-bold tracking-tight">
            {formatCurrency(currentNetWorth)}
          </p>
        </div>

        {/* Net Savings */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Net Savings ({year})
          </p>
          <p
            className={`text-3xl font-semibold tracking-tight ${
              netSavings >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
            }`}
          >
            {netSavings >= 0 ? '+' : ''}
            {formatCurrency(netSavings)}
          </p>
        </div>
      </div>
    </div>
  );
}
