import { formatCurrency } from '@/lib/format';
import type { MonthGroup, Transaction } from '@/types/transaction';
import { TransactionCard } from './TransactionCard';

interface TransactionMonthGroupProps {
  group: MonthGroup;
  onTransactionClick?: (transaction: Transaction) => void;
  onTransactionLongPress?: (transaction: Transaction) => void;
}

export function TransactionMonthGroup({ group, onTransactionClick, onTransactionLongPress }: TransactionMonthGroupProps) {
  return (
    <div className="mb-8">
      {/* Month Header */}
      <div className="flex items-baseline justify-between mb-4 pb-2 border-b">
        <h3 className="text-lg font-semibold">{group.month}</h3>
        <div className="text-sm">
          <span className={`font-medium ${group.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {group.net >= 0 ? '+' : ''}{formatCurrency(group.net)}
          </span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {group.transactions.map((transaction) => (
          <TransactionCard 
            key={transaction.id} 
            transaction={transaction}
            onClick={onTransactionClick}
            onLongPress={onTransactionLongPress}
          />
        ))}
      </div>
    </div>
  );
}
