import type { Transaction, MonthGroup } from '@/types/transaction';

export function groupTransactionsByMonth(transactions: Transaction[]): MonthGroup[] {
  // Sort by date descending
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group by month
  const groups: Map<string, Transaction[]> = new Map();

  sorted.forEach((txn) => {
    const date = new Date(txn.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groups.has(monthKey)) {
      groups.set(monthKey, []);
    }
    groups.get(monthKey)!.push(txn);
  });

  // Convert to MonthGroup array
  return Array.from(groups.entries()).map(([monthKey, txns]) => {
    const [year, month] = monthKey.split('-').map(Number);
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const totalExpenses = txns
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = txns
      .filter((t) => t.amount >= 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: monthName,
      monthKey,
      transactions: txns,
      totalExpenses,
      totalIncome,
      net: totalIncome - totalExpenses,
    };
  });
}
