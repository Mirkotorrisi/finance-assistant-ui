import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionsHeaderDesktopProps {
  onAddTransaction: () => void;
}

export function TransactionsHeaderDesktop({ onAddTransaction }: TransactionsHeaderDesktopProps) {
  return (
    <div className="flex items-center justify-between p-8 border-b">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          All your financial movements in one place
        </p>
      </div>
      <Button onClick={onAddTransaction}>
        <Plus className="h-4 w-4 mr-2" />
        Add transaction
      </Button>
    </div>
  );
}
