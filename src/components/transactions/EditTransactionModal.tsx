import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Transaction, TransactionUpdate, Account, Category } from '@/types/transaction';

interface EditTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (id: number, data: TransactionUpdate) => Promise<void>;
}

export function EditTransactionModal({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  onSubmit,
}: EditTransactionModalProps) {
  const [formData, setFormData] = useState<TransactionUpdate>({
    description: '',
    category: '',
    amount: 0,
    date: '',
    currency: 'USD',
  });
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when transaction changes
  useEffect(() => {
    if (transaction && open) {
      const isExpense = transaction.amount < 0;
      setTransactionType(isExpense ? 'expense' : 'income');
      setFormData({
        description: transaction.description,
        category: transaction.category,
        amount: Math.abs(transaction.amount),
        date: transaction.date,
        currency: transaction.currency,
      });
      setErrors({});
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.description?.trim()) {
      newErrors.description = 'Transaction name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      // Convert to negative for expenses, ensure positive for income
      const finalAmount = transactionType === 'expense' 
        ? -Math.abs(formData.amount!) 
        : Math.abs(formData.amount!);
      
      await onSubmit(transaction.id, { 
        ...formData, 
        amount: finalAmount 
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      setErrors({ submit: 'Failed to update transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = useMemo(
    () => categories.filter(cat => cat.type === transactionType),
    [categories, transactionType]
  );

  const accountName = useMemo(() => {
    if (!transaction?.account_id) return '';
    const account = accounts.find(acc => acc.id === transaction.account_id);
    return account?.name || '';
  }, [transaction, accounts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={transactionType === 'expense' ? 'default' : 'outline'}
                onClick={() => setTransactionType('expense')}
                className="flex-1"
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={transactionType === 'income' ? 'default' : 'outline'}
                onClick={() => setTransactionType('income')}
                className="flex-1"
              >
                Income
              </Button>
            </div>
          </div>

          {/* Transaction Name */}
          <div className="space-y-2">
            <Label htmlFor="description">Transaction Name *</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Grocery shopping"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              id="category"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select a category</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Account */}
          {accountName && (
            <div className="space-y-2">
              <Label htmlFor="account">Account (cannot be changed)</Label>
              <Input
                id="account"
                value={accountName}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600">{errors.submit}</p>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
