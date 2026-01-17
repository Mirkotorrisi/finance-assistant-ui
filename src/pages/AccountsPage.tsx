import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { accountService } from '@/services/accountService';
import type { 
  Account, 
  AccountCreate,
  AccountUpdate
} from '@/types/account';

// Components
import { AccountsHeader } from '@/components/accounts/AccountsHeader';
import { AccountsHeaderDesktop } from '@/components/accounts/AccountsHeaderDesktop';
import { AccountsOverview } from '@/components/accounts/AccountsOverview';
import { AccountsOverviewDesktop } from '@/components/accounts/AccountsOverviewDesktop';
import { AccountsList } from '@/components/accounts/AccountsList';
import { AccountsGrid } from '@/components/accounts/AccountsGrid';
import { EmptyState } from '@/components/accounts/EmptyState';
import { AddAccountModal } from '@/components/accounts/AddAccountModal';
import { DeleteAccountDialog } from '@/components/accounts/DeleteAccountDialog';
import { AccountContextMenu } from '@/components/accounts/AccountContextMenu';
import { Button } from '@/components/ui/button';

export function AccountsPage() {
  const isDesktop = useIsDesktop();
  
  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Load data
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const accs = await accountService.listAccounts();
      setAccounts(accs);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);

  // Handlers
  const handleAddOrUpdateAccount = async (
    data: AccountCreate | { id: number; data: AccountUpdate }
  ) => {
    if ('id' in data) {
      // Update
      const updatedAccount = await accountService.updateAccount(data.id, data.data);
      setAccounts(accounts.map(acc => acc.id === data.id ? updatedAccount : acc));
      setIsEditModalOpen(false);
      setSelectedAccount(null);
    } else {
      // Create
      const newAccount = await accountService.createAccount(data);
      setAccounts([...accounts, newAccount]);
      setIsAddModalOpen(false);
    }
  };

  const handleAccountClick = (account: Account) => {
    // Future: navigate to account details
    console.log('Account clicked:', account);
  };

  const handleAccountLongPress = (account: Account) => {
    setSelectedAccount(account);
    setIsContextMenuOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    
    try {
      await accountService.deleteAccount(selectedAccount.id);
      setAccounts(accounts.filter(acc => acc.id !== selectedAccount.id));
      setIsDeleteDialogOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  };

  const handleContextMenuEdit = () => {
    setIsContextMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const handleContextMenuDelete = () => {
    setIsContextMenuOpen(false);
    setIsDeleteDialogOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading accounts...</div>
        </div>
      </div>
    );
  }

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-1">
          {/* Header */}
          <AccountsHeaderDesktop onAddAccount={() => setIsAddModalOpen(true)} />

          {/* Overview */}
          {accounts.length > 0 && (
            <AccountsOverviewDesktop totalBalance={totalBalance} />
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {/* Account Grid or Empty State */}
              {accounts.length === 0 ? (
                <EmptyState onAddAccount={() => setIsAddModalOpen(true)} />
              ) : (
                <AccountsGrid
                  accounts={accounts}
                  onAccountClick={handleAccountClick}
                  onEdit={handleEditAccount}
                  onDelete={(account) => {
                    setSelectedAccount(account);
                    setIsDeleteDialogOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Account Modal */}
        <AddAccountModal
          open={isAddModalOpen || isEditModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            if (!open) setSelectedAccount(null);
          }}
          account={isEditModalOpen ? selectedAccount : null}
          onSubmit={handleAddOrUpdateAccount}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteAccountDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteAccount}
          accountName={selectedAccount?.name}
        />
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <AccountsHeader />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview */}
        {accounts.length > 0 && (
          <div className="mb-4">
            <AccountsOverview totalBalance={totalBalance} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Account List or Empty State */}
        {accounts.length === 0 ? (
          <EmptyState onAddAccount={() => setIsAddModalOpen(true)} />
        ) : (
          <AccountsList
            accounts={accounts}
            onAccountClick={handleAccountClick}
            onAccountLongPress={handleAccountLongPress}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setIsAddModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Modals */}
      <AddAccountModal
        open={isAddModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          if (!open) setSelectedAccount(null);
        }}
        account={isEditModalOpen ? selectedAccount : null}
        onSubmit={handleAddOrUpdateAccount}
      />

      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteAccount}
        accountName={selectedAccount?.name}
      />

      <AccountContextMenu
        open={isContextMenuOpen}
        onClose={() => setIsContextMenuOpen(false)}
        onEdit={handleContextMenuEdit}
        onDelete={handleContextMenuDelete}
      />
    </div>
  );
}
