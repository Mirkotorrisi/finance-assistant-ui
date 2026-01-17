import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddAccount: () => void;
}

export function EmptyState({ onAddAccount }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Start managing your finances by adding your first account
      </p>
      <Button onClick={onAddAccount}>
        <Wallet className="h-4 w-4 mr-2" />
        Add your first account
      </Button>
    </div>
  );
}
