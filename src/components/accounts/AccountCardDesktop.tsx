import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import type { Account } from '@/types/account';
import { useState, useRef, useEffect } from 'react';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const accountTypeLabel = account.type.charAt(0).toUpperCase() + account.type.slice(1);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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
        
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          
          {isMenuOpen && (
            <div 
              className="absolute right-0 top-10 w-48 bg-background border border-border rounded-md shadow-lg p-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                className="w-full justify-start"
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
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
          )}
        </div>
      </div>
    </Card>
  );
}
