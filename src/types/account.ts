export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currency: string;
  current_balance: number;
  is_active: boolean;
  lastUpdated?: string;
}

export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "credit"
  | "investment"
  | "other";

export interface AccountCreate {
  name: string;
  account_type: AccountType;
  currency?: string;
  initial_balance: number;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  is_active?: boolean;
}

export interface AccountsOverview {
  totalBalance: number;
  accountsByType: {
    type: AccountType;
    count: number;
    totalBalance: number;
  }[];
}
