import { AccountCard } from './AccountCard';
import type { Account } from '@/types/account';

interface AccountsListProps {
  accounts: Account[];
  onAccountClick: (account: Account) => void;
  onAccountLongPress: (account: Account) => void;
}

export function AccountsList({ 
  accounts, 
  onAccountClick, 
  onAccountLongPress 
}: AccountsListProps) {
  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          onClick={() => onAccountClick(account)}
          onLongPress={() => onAccountLongPress(account)}
        />
      ))}
    </div>
  );
}
