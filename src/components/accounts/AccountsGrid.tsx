import { AccountCardDesktop } from './AccountCardDesktop';
import type { Account } from '@/types/account';

interface AccountsGridProps {
  accounts: Account[];
  onAccountClick: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountsGrid({ 
  accounts, 
  onAccountClick,
  onEdit,
  onDelete
}: AccountsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account) => (
        <AccountCardDesktop
          key={account.id}
          account={account}
          onClick={() => onAccountClick(account)}
          onEdit={() => onEdit(account)}
          onDelete={() => onDelete(account)}
        />
      ))}
    </div>
  );
}
