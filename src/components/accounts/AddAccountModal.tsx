import { useState, useEffect } from 'react';
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
import type { AccountCreate, AccountUpdate, Account, AccountType } from '@/types/account';

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null; // If provided, we're editing
  onSubmit: (data: AccountCreate | { id: number; data: AccountUpdate }) => Promise<void>;
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
];

export function AddAccountModal({
  open,
  onOpenChange,
  account,
  onSubmit,
}: AddAccountModalProps) {
  const isEditing = !!account;

  const [formData, setFormData] = useState<AccountCreate>({
    name: '',
    type: 'checking',
    currency: 'USD',
    initialBalance: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when account changes
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        currency: account.currency,
        initialBalance: account.currentBalance,
      });
    } else {
      setFormData({
        name: '',
        type: 'checking',
        currency: 'USD',
        initialBalance: 0,
      });
    }
    setErrors({});
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }
    if (!isEditing && isNaN(formData.initialBalance)) {
      newErrors.initialBalance = 'Balance must be a valid number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditing) {
        // For editing, only send name and type
        await onSubmit({
          id: account.id,
          data: {
            name: formData.name,
            type: formData.type,
          },
        });
      } else {
        // For creating, send all fields
        await onSubmit(formData);
      }
      
      // Reset form
      setFormData({
        name: '',
        type: 'checking',
        currency: 'USD',
        initialBalance: 0,
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save account:', error);
      setErrors({ submit: `Failed to ${isEditing ? 'update' : 'create'} account. Please try again.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Checking"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Account Type *</Label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
            >
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Currency */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
          )}

          {/* Initial Balance */}
          <div className="space-y-2">
            <Label htmlFor="balance">
              {isEditing ? 'Current Balance (read-only)' : 'Initial Balance *'}
            </Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.initialBalance || ''}
              onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              disabled={isEditing}
              className={isEditing ? 'bg-muted cursor-not-allowed' : ''}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Balance is calculated from snapshots and cannot be edited directly
              </p>
            )}
            {errors.initialBalance && (
              <p className="text-sm text-red-600">{errors.initialBalance}</p>
            )}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
