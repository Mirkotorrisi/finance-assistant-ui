export type AmazonJobStep = 'queued' | 'parsing_csv' | 'matching' | 'categorizing' | 'saving'

export interface AmazonUpdatedTransaction {
  order_id: string
  transaction_id: number
  old_category: string
  new_category: string
  products: string[]
}

export interface AmazonUnmatchedOrder {
  order_id: string
  products: string[]
  total_amount: number
  order_date: string
  reason: 'no_matching_transaction' | 'ambiguous_match'
  candidate_transaction_ids: number[]
}

export interface AmazonUploadResult {
  success: boolean
  message: string
  orders_parsed: number
  orders_matched: number
  transactions_updated: number
  unmatched_orders: AmazonUnmatchedOrder[]
  updated_transactions: AmazonUpdatedTransaction[]
}

export interface AmazonJobStatus {
  status: 'processing' | 'complete' | 'error'
  step?: AmazonJobStep
  result?: AmazonUploadResult
  error?: string
}

export interface AmazonUploadJobResponse {
  job_id: string
}
