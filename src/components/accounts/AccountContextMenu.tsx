import { Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AccountContextMenuProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AccountContextMenu({
  open,
  onClose,
  onEdit,
  onDelete,
}: AccountContextMenuProps) {
  if (!open) return null;

  const handleEdit = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onEdit();
    onClose();
  };

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onDelete();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-in slide-in-from-bottom">
        <Card className="overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-accent/50 active:bg-accent transition-colors"
            onClick={handleEdit}
          >
            <Edit2 className="h-5 w-5 text-blue-600" />
            <span className="text-base font-medium">Edit Account</span>
          </button>
          
          <div className="border-t border-border" />
          
          <button
            className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-accent/50 active:bg-accent transition-colors"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5 text-red-600" />
            <span className="text-base font-medium text-red-600">Delete Account</span>
          </button>
        </Card>

        {/* Cancel button */}
        <button
          className="w-full mt-2 bg-background border border-border rounded-lg px-4 py-3 text-base font-medium hover:bg-accent/50 active:bg-accent transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </>
  );
}
