/**
 * Health service – maps to the backend /health endpoint.
 */

import { get } from './http'

export interface HealthResponse {
  status: string
}

export const healthService = {
  /** GET /health */
  check(): Promise<HealthResponse> {
    return get<HealthResponse>('/health')
  },
}
