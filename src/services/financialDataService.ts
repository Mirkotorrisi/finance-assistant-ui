import { apiClient } from './apiClient';
import type { FinancialData } from '@/types/finance';

/**
 * Service for financial data operations
 */
export const financialDataService = {
  /**
   * Fetch financial data for a specific year
   * @param year - The year to fetch data for
   * @returns Financial data for the specified year
   */
  async getFinancialData(year: number): Promise<FinancialData> {
    return apiClient.get<FinancialData>(`/api/financial-data/${year}`);
  },

  /**
   * Fetch financial data for the current year
   * @returns Financial data for the current year
   */
  async getCurrentFinancialData(): Promise<FinancialData> {
    const currentYear = new Date().getFullYear();
    return this.getFinancialData(currentYear);
  },
};
