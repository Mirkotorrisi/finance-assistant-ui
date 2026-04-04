/**
 * UI Plan types – the contract returned by the chat/plan endpoint (or mock generator).
 *
 * The frontend validates this at runtime using the Zod schema in lib/schemas/ui-plan.ts
 * and refuses to render any unknown component types.
 */

export type WhitelistedComponentType =
  | 'SummaryCards'
  | 'TransactionsTable'
  | 'AccountsList'
  | 'SpendingPie'
  | 'MonthlyBarChart'
  | 'FormTransaction'
  | 'FormAccount'

export type ServiceName =
  | 'transactions'
  | 'accounts'
  | 'financialData'
  | 'financialSummary'
  | 'health'

export type MethodName = string

export interface ComponentAction {
  service: ServiceName
  method: MethodName
  params: Record<string, unknown>
}

export interface UIPlanComponent {
  type: WhitelistedComponentType
  order: number
  title?: string
  action?: ComponentAction
}

export interface UIPlan {
  text: string
  components: UIPlanComponent[]
}

/** Response shape from the configurable CHAT_PLAN_URL endpoint */
export interface ChatPlanResponse {
  text: string
  plan?: UIPlan
}
