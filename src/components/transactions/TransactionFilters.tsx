import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { TransactionFilters, Account, Category } from '@/types/transaction';

interface TransactionFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TransactionFilters;
  accounts: Account[];
  categories: Category[];
  onFiltersChange: (filters: TransactionFilters) => void;
}

export function TransactionFilters({
  open,
  onOpenChange,
  filters,
  accounts,
  categories,
  onFiltersChange,
}: TransactionFiltersProps) {
  const handleAccountToggle = (accountId: number) => {
    const newAccounts = filters.accounts.includes(accountId)
      ? filters.accounts.filter(id => id !== accountId)
      : [...filters.accounts, accountId];
    onFiltersChange({ ...filters, accounts: newAccounts });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleTypeChange = (type: 'all' | 'expense' | 'income') => {
    onFiltersChange({ ...filters, type });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value || null,
      },
    });
  };

  const handleReset = () => {
    onFiltersChange({
      accounts: [],
      categories: [],
      dateRange: { start: null, end: null },
      type: 'all',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Transactions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Filter */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select
              value={filters.type}
              onChange={(e) => handleTypeChange(e.target.value as typeof filters.type)}
            >
              <option value="all">All</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="Start date"
                value={filters.dateRange.start || ''}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
              <Input
                type="date"
                placeholder="End date"
                value={filters.dateRange.end || ''}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>

          {/* Accounts */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>Accounts</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {accounts.map((account) => (
                  <label key={account.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.accounts.includes(account.id)}
                      onChange={() => handleAccountToggle(account.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{account.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.name)}
                      onChange={() => handleCategoryToggle(category.name)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-1">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
