import { MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/types/account";

interface AccountCardProps {
  account: Account;
  onLongPress?: () => void;
  onClick?: () => void;
}

export function AccountCard({
  account,
  onLongPress,
  onClick,
}: AccountCardProps) {
  const accountTypeLabel =
    account.type.charAt(0).toUpperCase() + account.type.slice(1);

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.();
      }}
      onTouchStart={(e) => {
        const timer = setTimeout(() => {
          onLongPress?.();
        }, 500);
        const cancel = () => {
          clearTimeout(timer);
          e.currentTarget.removeEventListener("touchend", cancel);
          e.currentTarget.removeEventListener("touchmove", cancel);
        };
        e.currentTarget.addEventListener("touchend", cancel);
        e.currentTarget.addEventListener("touchmove", cancel);
      }}
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
              {formatCurrency(account.current_balance)}
            </span>
            <span className="text-sm text-muted-foreground">
              {account.currency}
            </span>
          </div>
        </div>
        <button
          className="p-1 hover:bg-accent rounded-full transition-colors lg:hidden"
          onClick={(e) => {
            e.stopPropagation();
            onLongPress?.();
          }}
        >
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </Card>
  );
}
