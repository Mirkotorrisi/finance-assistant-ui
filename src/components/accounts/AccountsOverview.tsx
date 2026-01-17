import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';

interface AccountsOverviewProps {
  totalBalance: number;
}

export function AccountsOverview({ totalBalance }: AccountsOverviewProps) {
  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground mb-1">Total Balance</div>
      <div className="text-3xl font-bold">{formatCurrency(totalBalance)}</div>
    </Card>
  );
}
