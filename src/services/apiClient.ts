import { config } from '@/config/env';

/**
 * API Error structure from backend
 */
export interface ApiError {
  detail?: string | { loc: string[]; msg: string; type: string }[];
  message?: string;
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  public status: number;
  public fieldErrors: Record<string, string> = {};
  
  constructor(status: number, message: string, apiError?: ApiError) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    
    // Parse field-level errors from backend
    if (apiError?.detail && Array.isArray(apiError.detail)) {
      apiError.detail.forEach(err => {
        // Extract field name from location (e.g., ['body', 'account_type'] -> 'account_type')
        if (err.loc && err.loc.length > 0) {
          const fieldName = err.loc[err.loc.length - 1];
          this.fieldErrors[fieldName] = err.msg;
        }
      });
    }
  }
}

/**
 * Base API client for making HTTP requests to the backend
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }
  
  /**
   * Handle error responses from the backend
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let apiError: ApiError | undefined;
    
    try {
      apiError = await response.json();
    } catch {
      // If response is not JSON, use status text
    }
    
    const message = apiError?.message 
      || (typeof apiError?.detail === 'string' ? apiError.detail : undefined)
      || `HTTP error! status: ${response.status}`;
    throw new ApiClientError(response.status, message, apiError);
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return this.handleErrorResponse(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Generic POST request
   */
  async post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        return this.handleErrorResponse(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error posting to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Generic PUT request
   */
  async put<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        return this.handleErrorResponse(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error putting to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T = void>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return this.handleErrorResponse(response);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting from ${url}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
