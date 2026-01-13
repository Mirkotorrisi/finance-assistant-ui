import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardHeaderDesktop } from './DashboardHeaderDesktop';
import { NetWorthSection } from './NetWorthSection';
import { NetWorthSectionDesktop } from './NetWorthSectionDesktop';
import { ExpensesIncomeSection } from './ExpensesIncomeSection';
import { ExpensesIncomeSectionDesktop } from './ExpensesIncomeSectionDesktop';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import type { FinancialData } from '@/types/finance';

interface DashboardProps {
  data: FinancialData;
}

export function Dashboard({ data }: DashboardProps) {
  const isDesktop = useIsDesktop();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleYearChange = () => {
    // TODO: Implement year selector dialog
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background">
        {/* Desktop: Constrained max width for readability */}
        <div className="max-w-[1400px] mx-auto">
          {/* Header Section - Desktop */}
          <DashboardHeaderDesktop
            year={data.year}
            currentNetWorth={data.currentNetWorth}
            netSavings={data.netSavings}
            onYearChange={handleYearChange}
            onUploadClick={handleUploadClick}
          />

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Net Worth Section - Desktop */}
          <NetWorthSectionDesktop
            monthlyData={data.monthlyData}
            accountBreakdown={data.accountBreakdown}
          />

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Expenses & Income Section - Desktop */}
          <ExpensesIncomeSectionDesktop monthlyData={data.monthlyData} />

          {/* Bottom Spacing */}
          <div className="h-12" />
        </div>

        {/* File Upload Dialog */}
        <FileUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
        />
      </div>
    );
  }

  // Mobile Layout (Original)
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <DashboardHeader
          year={data.year}
          currentNetWorth={data.currentNetWorth}
          netSavings={data.netSavings}
          onYearChange={handleYearChange}
          onUploadClick={handleUploadClick}
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

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />
    </div>
  );
}
