import { ChevronDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

interface DashboardHeaderDesktopProps {
  year: number;
  currentNetWorth: number;
  netSavings: number;
  onYearChange: () => void;
  onUploadClick: () => void;
}

export function DashboardHeaderDesktop({
  year,
  currentNetWorth,
  netSavings,
  onYearChange,
  onUploadClick,
}: DashboardHeaderDesktopProps) {
  return (
    <div className="bg-background border-b border-border">
      <div className="px-8 py-6">
        {/* Year Selector and Upload Button */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onYearChange}
            className="flex items-center gap-2 text-lg font-medium"
          >
            <span>{year}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button onClick={onUploadClick}>
            <Upload className="h-4 w-4" />
            <span>Upload Data</span>
          </Button>
        </div>

        {/* Hero Numbers - Horizontal Layout */}
        <div className="flex items-start gap-12">
          {/* Current Net Worth */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              Current Net Worth
            </p>
            <p className="text-5xl font-bold tracking-tight">
              {formatCurrency(currentNetWorth)}
            </p>
          </div>

          {/* Net Savings */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              Net Savings ({year})
            </p>
            <p
              className={`text-4xl font-semibold tracking-tight ${
                netSavings >= 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }`}
            >
              {netSavings >= 0 ? '+' : ''}
              {formatCurrency(netSavings)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
