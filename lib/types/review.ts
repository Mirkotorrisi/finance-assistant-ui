export interface Coverage {
  total: number
  reviewed_amount: number
  unreviewed_amount: number
  /** 0-1: the part of the total that rests on categories the user confirmed. */
  reviewed_share: number
  reviewed_transactions: number
  unreviewed_transactions: number
}

export interface ReviewGroup {
  merchant_key: string
  transactions: number
  net_amount: number
  total_amount: number
  descriptions: string[]
  transaction_ids: number[]
  suggestion: {
    category: string
    key: string | null
    label: string | null
    transactions: number
    confidence: number | null
    source: string
  }
  /** The merchant's transactions were given different categories. */
  mixed: boolean
}

export interface ReviewQueue {
  total_groups: number
  unreviewed_transactions: number
  groups: ReviewGroup[]
  coverage: Coverage
}
