import { DashboardHeader } from './DashboardHeader';
import { NetWorthSection } from './NetWorthSection';
import { ExpensesIncomeSection } from './ExpensesIncomeSection';
import type { FinancialData } from '@/types/finance';

interface DashboardProps {
  data: FinancialData;
}

export function Dashboard({ data }: DashboardProps) {
  const handleYearChange = () => {
    // TODO: Implement year selector dialog
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <DashboardHeader
          year={data.year}
          currentNetWorth={data.currentNetWorth}
          netSavings={data.netSavings}
          onYearChange={handleYearChange}
        />

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Net Worth Section */}
        <NetWorthSection
          monthlyData={data.monthlyData}
          accountBreakdown={data.accountBreakdown}
        />

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Expenses & Income Section */}
        <ExpensesIncomeSection monthlyData={data.monthlyData} />

        {/* Bottom Spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
