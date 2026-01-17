import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccountsHeaderDesktopProps {
  onAddAccount: () => void;
}

export function AccountsHeaderDesktop({ onAddAccount }: AccountsHeaderDesktopProps) {
  return (
    <div className="border-b bg-background">
      <div className="px-8 py-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <Button onClick={onAddAccount}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>
    </div>
  );
}
