/**
 * Investments service – maps to the backend /api/investments endpoint.
 */

import { get } from './http'
import type { Portfolio } from '@/lib/types/investments'

export const investmentsService = {
  /** GET /api/investments – positions and realised result read from the statements */
  portfolio(): Promise<Portfolio> {
    return get<Portfolio>('/api/investments')
  },
}
