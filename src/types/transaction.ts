// Transaction types
export interface Transaction {
  id: number;
  date: string; // ISO format: "2026-01-15"
  amount: number; // Positive = income, negative = expense
  category: string;
  description: string;
  currency: string;
  account_id?: number;
}

export interface TransactionCreate {
  amount: number;
  category: string;
  description: string;
  date?: string;
  currency?: string;
  account_id?: number;
}

export interface TransactionUpdate {
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  currency?: string;
}

// Filter types
export interface TransactionFilters {
  accounts: number[];
  categories: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  type: 'all' | 'expense' | 'income';
}

// Account types
export interface Account {
  id: number;
  name: string;
  type: string;
  currency: string;
  is_active: boolean;
}

// Category types
export interface Category {
  id: number;
  name: string;
  type: 'expense' | 'income';
  color?: string;
}

export interface CategoryCreate {
  name: string;
  type: 'expense' | 'income';
  color?: string;
}

// Grouped transactions for display
export interface MonthGroup {
  month: string; // "January 2026"
  monthKey: string; // "2026-01"
  transactions: Transaction[];
  totalExpenses: number;
  totalIncome: number;
  net: number;
}
