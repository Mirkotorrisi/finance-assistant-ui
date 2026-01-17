import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format';
import type { Account } from '@/types/account';
import { useState } from 'react';

interface AccountCardDesktopProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
  onClick?: () => void;
}

export function AccountCardDesktop({ 
  account, 
  onEdit, 
  onDelete,
  onClick 
}: AccountCardDesktopProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const accountTypeLabel = account.type.charAt(0).toUpperCase() + account.type.slice(1);

  return (
    <Card 
      className="p-6 cursor-pointer hover:shadow-md transition-all relative group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {accountTypeLabel}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold mb-1">{account.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formatCurrency(account.currentBalance)}
            </span>
            <span className="text-sm text-muted-foreground">
              {account.currency}
            </span>
          </div>
        </div>
        
        <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(true);
              }}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="w-48 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
