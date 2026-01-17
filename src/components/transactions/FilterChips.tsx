import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TransactionFilters } from '@/types/transaction';

interface FilterChipsProps {
  filters: TransactionFilters;
  accounts: Map<number, string>;
  onRemoveAccount: (accountId: number) => void;
  onRemoveCategory: (category: string) => void;
  onRemoveDateRange: () => void;
  onClearAll: () => void;
}

export function FilterChips({
  filters,
  accounts,
  onRemoveAccount,
  onRemoveCategory,
  onRemoveDateRange,
  onClearAll,
}: FilterChipsProps) {
  const hasActiveFilters = 
    filters.accounts.length > 0 || 
    filters.categories.length > 0 || 
    filters.dateRange.start !== null || 
    filters.type !== 'all';

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg">
      {/* Account filters */}
      {filters.accounts.map((accountId) => (
        <Badge key={`account-${accountId}`} variant="secondary" className="gap-1">
          {accounts.get(accountId) || `Account ${accountId}`}
          <button
            onClick={() => onRemoveAccount(accountId)}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Category filters */}
      {filters.categories.map((category) => (
        <Badge key={`category-${category}`} variant="secondary" className="gap-1">
          {category}
          <button
            onClick={() => onRemoveCategory(category)}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Date range filter */}
      {filters.dateRange.start && (
        <Badge variant="secondary" className="gap-1">
          {filters.dateRange.start} - {filters.dateRange.end || 'Now'}
          <button
            onClick={onRemoveDateRange}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Type filter */}
      {filters.type !== 'all' && (
        <Badge variant="secondary">
          {filters.type === 'expense' ? 'Expenses only' : 'Income only'}
        </Badge>
      )}

      {/* Clear all button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 text-xs"
      >
        Clear all
      </Button>
    </div>
  );
}
