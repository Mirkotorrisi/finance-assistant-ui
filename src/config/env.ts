/**
 * Application configuration
 * Environment variables are accessed through import.meta.env in Vite
 */

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
} as const;
