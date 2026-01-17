import type { MonthGroup, Transaction } from '@/types/transaction';
import { TransactionMonthGroup } from './TransactionMonthGroup';

interface TransactionListProps {
  groups: MonthGroup[];
  onTransactionClick?: (transaction: Transaction) => void;
  onTransactionLongPress?: (transaction: Transaction) => void;
}

export function TransactionList({ groups, onTransactionClick, onTransactionLongPress }: TransactionListProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <TransactionMonthGroup
          key={group.monthKey}
          group={group}
          onTransactionClick={onTransactionClick}
          onTransactionLongPress={onTransactionLongPress}
        />
      ))}
    </div>
  );
}
