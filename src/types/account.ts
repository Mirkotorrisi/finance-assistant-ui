export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currency: string;
  currentBalance: number;
  is_active: boolean;
  lastUpdated?: string;
}

export type AccountType = 
  | 'checking' 
  | 'savings' 
  | 'cash' 
  | 'credit' 
  | 'investment' 
  | 'other';

export interface AccountCreate {
  name: string;
  type: AccountType;
  currency?: string;
  initialBalance: number;
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
