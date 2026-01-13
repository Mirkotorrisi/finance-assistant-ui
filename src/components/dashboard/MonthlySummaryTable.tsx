import type { MonthlyData } from '@/types/finance';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MonthlySummaryTableProps {
  monthlyData: MonthlyData[];
}

export function MonthlySummaryTable({ monthlyData }: MonthlySummaryTableProps) {
  // Calculate totals for the footer
  const totals = monthlyData.reduce(
    (acc, month) => ({
      income: acc.income + month.income,
      expenses: acc.expenses + month.expenses,
      net: acc.net + month.net,
    }),
    { income: 0, expenses: 0, net: 0 }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mese</TableHead>
            <TableHead className="text-right">Entrate</TableHead>
            <TableHead className="text-right">Uscite</TableHead>
            <TableHead className="text-right">Netto</TableHead>
            <TableHead className="text-right">Patrimonio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthlyData.map((month) => (
            <TableRow key={month.month}>
              <TableCell className="font-medium">{month.month}</TableCell>
              <TableCell className="text-right text-green-600">
                {formatCurrency(month.income)}
              </TableCell>
              <TableCell className="text-right text-red-600">
                {formatCurrency(month.expenses)}
              </TableCell>
              <TableCell className={`text-right ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(month.net)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(month.netWorth)}
              </TableCell>
            </TableRow>
          ))}
          {/* Totals Row */}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell>Totale</TableCell>
            <TableCell className="text-right text-green-600">
              {formatCurrency(totals.income)}
            </TableCell>
            <TableCell className="text-right text-red-600">
              {formatCurrency(totals.expenses)}
            </TableCell>
            <TableCell className={`text-right ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.net)}
            </TableCell>
            <TableCell className="text-right">-</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
