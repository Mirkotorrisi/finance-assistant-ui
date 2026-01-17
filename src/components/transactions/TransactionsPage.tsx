import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { transactionService } from '@/services';
import { groupTransactionsByMonth } from '@/lib/transactionUtils';
import type { 
  Transaction, 
  TransactionFilters as TransactionFiltersType, 
  Account, 
  Category,
  TransactionCreate 
} from '@/types/transaction';

// Components
import { TransactionsHeader } from './TransactionsHeader';
import { TransactionsHeaderDesktop } from './TransactionsHeaderDesktop';
import { TransactionFilters } from './TransactionFilters';
import { TransactionFiltersDesktop } from './TransactionFiltersDesktop';
import { FilterChips } from './FilterChips';
import { TransactionList } from './TransactionList';
import { EmptyState } from './EmptyState';
import { AddTransactionModal } from './AddTransactionModal';
import { Button } from '@/components/ui/button';

export function TransactionsPage() {
  const isDesktop = useIsDesktop();
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<TransactionFiltersType>({
    accounts: [],
    categories: [],
    dateRange: { start: null, end: null },
    type: 'all',
  });
  
  // Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load transactions
      const txns = await transactionService.listTransactions();
      setTransactions(txns);

      // Load accounts (with fallback)
      try {
        const accs = await transactionService.listAccounts();
        setAccounts(accs);
      } catch (err) {
        console.warn('Failed to load accounts:', err);
        setAccounts([]);
      }

      // Load categories (with fallback)
      try {
        const cats = await transactionService.listCategories();
        setCategories(cats);
      } catch (err) {
        console.warn('Failed to load categories:', err);
        // Fallback to mock categories
        setCategories([
          { id: 1, name: 'Food & Dining', type: 'expense' },
          { id: 2, name: 'Transportation', type: 'expense' },
          { id: 3, name: 'Shopping', type: 'expense' },
          { id: 4, name: 'Entertainment', type: 'expense' },
          { id: 5, name: 'Bills & Utilities', type: 'expense' },
          { id: 6, name: 'Healthcare', type: 'expense' },
          { id: 7, name: 'Salary', type: 'income' },
          { id: 8, name: 'Freelance', type: 'income' },
          { id: 9, name: 'Investment', type: 'income' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    // Type filter
    if (filters.type === 'expense' && txn.amount >= 0) return false;
    if (filters.type === 'income' && txn.amount < 0) return false;

    // Account filter
    if (filters.accounts.length > 0 && txn.account_id) {
      if (!filters.accounts.includes(txn.account_id)) return false;
    }

    // Category filter
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(txn.category)) return false;
    }

    // Date range filter
    if (filters.dateRange.start) {
      if (txn.date < filters.dateRange.start) return false;
    }
    if (filters.dateRange.end) {
      if (txn.date > filters.dateRange.end) return false;
    }

    return true;
  });

  const groupedTransactions = groupTransactionsByMonth(filteredTransactions);

  // Create account map for filter chips
  const accountMap = new Map(accounts.map(acc => [acc.id, acc.name]));

  // Handlers
  const handleAddTransaction = async (data: TransactionCreate) => {
    const newTransaction = await transactionService.createTransaction(data);
    // Add new transaction and maintain chronological order (most recent first)
    setTransactions([newTransaction, ...transactions]);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    // TODO: Implement transaction detail/edit modal
    console.log('Transaction clicked:', transaction);
  };

  const handleRemoveAccountFilter = (accountId: number) => {
    setFilters({
      ...filters,
      accounts: filters.accounts.filter(id => id !== accountId),
    });
  };

  const handleRemoveCategoryFilter = (category: string) => {
    setFilters({
      ...filters,
      categories: filters.categories.filter(c => c !== category),
    });
  };

  const handleRemoveDateRange = () => {
    setFilters({
      ...filters,
      dateRange: { start: null, end: null },
    });
  };

  const handleClearAllFilters = () => {
    setFilters({
      accounts: [],
      categories: [],
      dateRange: { start: null, end: null },
      type: 'all',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading transactions...</div>
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
          <TransactionsHeaderDesktop onAddTransaction={() => setIsAddModalOpen(true)} />

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Filters */}
            <TransactionFiltersDesktop
              filters={filters}
              accounts={accounts}
              categories={categories}
              onFiltersChange={setFilters}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8">
                {/* Filter Chips */}
                <FilterChips
                  filters={filters}
                  accounts={accountMap}
                  onRemoveAccount={handleRemoveAccountFilter}
                  onRemoveCategory={handleRemoveCategoryFilter}
                  onRemoveDateRange={handleRemoveDateRange}
                  onClearAll={handleClearAllFilters}
                />

                {/* Error State */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                {/* Transaction List or Empty State */}
                {groupedTransactions.length === 0 ? (
                  <EmptyState onAddTransaction={() => setIsAddModalOpen(true)} />
                ) : (
                  <TransactionList
                    groups={groupedTransactions}
                    onTransactionClick={handleTransactionClick}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Transaction Modal */}
        <AddTransactionModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          accounts={accounts}
          categories={categories}
          onSubmit={handleAddTransaction}
        />
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <TransactionsHeader onFilterClick={() => setIsFilterModalOpen(true)} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          accounts={accountMap}
          onRemoveAccount={handleRemoveAccountFilter}
          onRemoveCategory={handleRemoveCategoryFilter}
          onRemoveDateRange={handleRemoveDateRange}
          onClearAll={handleClearAllFilters}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Transaction List or Empty State */}
        {groupedTransactions.length === 0 ? (
          <EmptyState onAddTransaction={() => setIsAddModalOpen(true)} />
        ) : (
          <TransactionList
            groups={groupedTransactions}
            onTransactionClick={handleTransactionClick}
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
      <TransactionFilters
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        filters={filters}
        accounts={accounts}
        categories={categories}
        onFiltersChange={setFilters}
      />

      <AddTransactionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        accounts={accounts}
        categories={categories}
        onSubmit={handleAddTransaction}
      />
    </div>
  );
}
