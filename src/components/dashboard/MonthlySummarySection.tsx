import { MonthlySummaryTable } from './MonthlySummaryTable';
import type { MonthlyData } from '@/types/finance';

interface MonthlySummarySectionProps {
  monthlyData: MonthlyData[];
}

export function MonthlySummarySection({ monthlyData }: MonthlySummarySectionProps) {
  return (
    <section className="p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4">Riepilogo Mensile</h2>
      <MonthlySummaryTable monthlyData={monthlyData} />
    </section>
  );
}
