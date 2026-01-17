import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddTransaction: () => void;
}

export function EmptyState({ onAddTransaction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Plus className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Start tracking your finances by adding your first transaction
      </p>
      <Button onClick={onAddTransaction}>
        <Plus className="h-4 w-4 mr-2" />
        Add your first transaction
      </Button>
    </div>
  );
}
