import { apiClient } from './apiClient';
import type { 
  Account, 
  AccountCreate, 
  AccountUpdate,
  AccountsOverview
} from '@/types/account';

export const accountService = {
  async listAccounts(): Promise<Account[]> {
    return apiClient.get<Account[]>('/api/accounts');
  },

  async getAccount(id: number): Promise<Account> {
    return apiClient.get<Account>(`/api/accounts/${id}`);
  },

  async createAccount(data: AccountCreate): Promise<Account> {
    return apiClient.post<Account, AccountCreate>('/api/accounts', data);
  },

  async updateAccount(id: number, data: AccountUpdate): Promise<Account> {
    return apiClient.put<Account, AccountUpdate>(`/api/accounts/${id}`, data);
  },

  async deleteAccount(id: number): Promise<void> {
    return apiClient.delete(`/api/accounts/${id}`);
  },

  async getAccountBalance(accountId: number): Promise<number> {
    const response = await apiClient.get<{ balance: number }>(`/api/accounts/${accountId}/balance`);
    return response.balance;
  },

  async getAccountsOverview(): Promise<AccountsOverview> {
    return apiClient.get<AccountsOverview>('/api/accounts/overview');
  },
};
