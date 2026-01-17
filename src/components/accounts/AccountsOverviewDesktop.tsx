import { formatCurrency } from '@/lib/format';

interface AccountsOverviewDesktopProps {
  totalBalance: number;
}

export function AccountsOverviewDesktop({ totalBalance }: AccountsOverviewDesktopProps) {
  return (
    <div className="bg-muted/50 border-b">
      <div className="px-8 py-4 flex items-center gap-8">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Total Balance</div>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
        </div>
      </div>
    </div>
  );
}
