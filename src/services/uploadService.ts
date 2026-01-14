import { config } from '@/config/env';

/**
 * Response interface for successful statement upload
 */
export interface UploadStatementResponse {
  success: boolean;
  message: string;
  transactions_processed: number;
  transactions_added: number;
  transactions_skipped: number;
  transactions: string[];
}

/**
 * Validation error detail from backend
 */
export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * Response interface for validation errors (422)
 */
export interface UploadValidationError {
  detail: ValidationErrorDetail[];
}

/**
 * Service for file upload operations
 */
export const uploadService = {
  /**
   * Upload a bank statement file to be processed
   * @param file - The file to upload (PDF, XLS/XLSX, or CSV)
   * @returns Upload result with transaction statistics
   */
  async uploadStatement(file: File): Promise<UploadStatementResponse> {
    const url = `${config.apiBaseUrl}/statements/upload`;
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Handle validation errors (422)
        if (response.status === 422) {
          const errorData = (await response.json()) as UploadValidationError;
          const errorMessages = errorData.detail
            .map((err) => err.msg)
            .join(', ');
          throw new Error(errorMessages || 'Validation error occurred');
        }
        
        // Handle other HTTP errors
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      return (await response.json()) as UploadStatementResponse;
    } catch (error) {
      console.error(`Error uploading file to ${url}:`, error);
      throw error;
    }
  },
};
