import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { TransactionFilters, Account, Category } from '@/types/transaction';

interface TransactionFiltersDesktopProps {
  filters: TransactionFilters;
  accounts: Account[];
  categories: Category[];
  onFiltersChange: (filters: TransactionFilters) => void;
}

export function TransactionFiltersDesktop({
  filters,
  accounts,
  categories,
  onFiltersChange,
}: TransactionFiltersDesktopProps) {
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

  return (
    <div className="w-80 border-r bg-background p-6 space-y-6 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
      </div>

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
      <div className="space-y-2">
        <Label>Accounts</Label>
        <div className="space-y-2">
          {accounts.map((account) => (
            <label key={account.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id={`account-${account.id}`}
                checked={filters.accounts.includes(account.id)}
                onChange={() => handleAccountToggle(account.id)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{account.name}</span>
            </label>
          ))}
          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">No accounts available</p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label>Categories</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id={`category-${category.id}`}
                checked={filters.categories.includes(category.name)}
                onChange={() => handleCategoryToggle(category.name)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{category.name}</span>
            </label>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories available</p>
          )}
        </div>
      </div>

      {/* Reset Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => onFiltersChange({
          accounts: [],
          categories: [],
          dateRange: { start: null, end: null },
          type: 'all',
        })}
      >
        Reset Filters
      </Button>
    </div>
  );
}
