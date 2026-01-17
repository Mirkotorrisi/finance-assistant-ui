import { apiClient } from './apiClient';
import type { 
  Transaction, 
  TransactionCreate, 
  TransactionUpdate,
  Account,
  Category,
  CategoryCreate
} from '@/types/transaction';

export const transactionService = {
  async listTransactions(params?: {
    category?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const query = queryParams.toString();
    const endpoint = query ? `/api/transactions?${query}` : '/api/transactions';
    return apiClient.get<Transaction[]>(endpoint);
  },

  async createTransaction(data: TransactionCreate): Promise<Transaction> {
    return apiClient.post<Transaction, TransactionCreate>('/api/transactions', data);
  },

  async updateTransaction(id: number, data: TransactionUpdate): Promise<Transaction> {
    return apiClient.put<Transaction, TransactionUpdate>(`/api/transactions/${id}`, data);
  },

  async deleteTransaction(id: number): Promise<void> {
    return apiClient.delete(`/api/transactions/${id}`);
  },

  async listAccounts(): Promise<Account[]> {
    return apiClient.get<Account[]>('/api/accounts');
  },

  async listCategories(type?: 'expense' | 'income'): Promise<Category[]> {
    const endpoint = type ? `/api/categories?category_type=${type}` : '/api/categories';
    return apiClient.get<Category[]>(endpoint);
  },

  async createCategory(data: CategoryCreate): Promise<Category> {
    return apiClient.post<Category, CategoryCreate>('/api/categories', data);
  },
};
