import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionsHeaderProps {
  onFilterClick: () => void;
}

export function TransactionsHeader({ onFilterClick }: TransactionsHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          All your financial movements
        </p>
      </div>
      <Button variant="outline" size="icon" onClick={onFilterClick}>
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
