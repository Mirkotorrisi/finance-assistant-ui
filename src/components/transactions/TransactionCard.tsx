import { formatCurrency } from '@/lib/format';
import type { Transaction } from '@/types/transaction';
import { Card } from '@/components/ui/card';
import { useLongPress } from '@/hooks/useLongPress';

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  onLongPress?: (transaction: Transaction) => void;
}

export function TransactionCard({ transaction, onClick, onLongPress }: TransactionCardProps) {
  const isExpense = transaction.amount < 0;
  const displayAmount = Math.abs(transaction.amount);
  
  const longPress = useLongPress({
    onLongPress: () => {
      if (onLongPress) {
        onLongPress(transaction);
      }
    },
    onClick: () => {
      if (onClick) {
        onClick(transaction);
      }
    },
    delay: 500,
  });
  
  return (
    <Card 
      className={`p-4 hover:bg-accent/50 cursor-pointer transition-all select-none ${
        longPress.isPressed ? 'scale-[0.98] opacity-70' : ''
      }`}
      {...longPress.handlers}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{transaction.description}</div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="truncate">{transaction.category}</span>
            <span>•</span>
            <span className="text-xs">
              {new Date(transaction.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div 
          className={`font-semibold ml-4 ${
            isExpense ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {isExpense ? '-' : '+'}{formatCurrency(displayAmount)}
        </div>
      </div>
    </Card>
  );
}
