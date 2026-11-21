/** Mirrors finance-assistant-api/src/profile/schema.py, src/routes/profile.py and src/services/advisor_service.py. */

export type IncomeKind = 'employee' | 'self_employed' | 'mixed' | 'retired' | 'student' | 'other'
export type IncomeStability = 'stable' | 'variable' | 'uncertain'
export type DebtKind = 'mortgage' | 'personal_loan' | 'car_loan' | 'credit_card' | 'student_loan' | 'family' | 'other'
export type HousingStatus = 'own_outright' | 'own_mortgage' | 'rent' | 'family' | 'other' | 'unknown'
export type TfrChoice = 'company' | 'pension_fund' | 'not_applicable' | 'unknown'
export type GoalStatus = 'active' | 'reached' | 'dropped'
export type Experience = 'none' | 'basic' | 'intermediate' | 'advanced' | 'unknown'
export type DrawdownReaction = 'sell' | 'hold' | 'buy_more' | 'unknown'
export type AssetClass = 'equity' | 'bonds' | 'cash' | 'real_estate' | 'commodities' | 'crypto' | 'other'
export type ReviewCadence = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type IpsStatus = 'none' | 'pending' | 'approved'
export type DecisionStatus = 'proposed' | 'accepted' | 'rejected' | 'done'

export const INCOME_KINDS: IncomeKind[] = ['employee', 'self_employed', 'mixed', 'retired', 'student', 'other']
export const INCOME_STABILITIES: IncomeStability[] = ['stable', 'variable', 'uncertain']
export const DEBT_KINDS: DebtKind[] = ['mortgage', 'personal_loan', 'car_loan', 'credit_card', 'student_loan', 'family', 'other']
export const HOUSING_STATUSES: HousingStatus[] = ['own_outright', 'own_mortgage', 'rent', 'family', 'other', 'unknown']
export const TFR_CHOICES: TfrChoice[] = ['company', 'pension_fund', 'not_applicable', 'unknown']
export const GOAL_STATUSES: GoalStatus[] = ['active', 'reached', 'dropped']
export const EXPERIENCES: Experience[] = ['none', 'basic', 'intermediate', 'advanced', 'unknown']
export const DRAWDOWN_REACTIONS: DrawdownReaction[] = ['sell', 'hold', 'buy_more', 'unknown']
export const ASSET_CLASSES: AssetClass[] = ['equity', 'bonds', 'cash', 'real_estate', 'commodities', 'crypto', 'other']
export const REVIEW_CADENCES: ReviewCadence[] = ['monthly', 'quarterly', 'semiannual', 'annual']
export const DECISION_STATUSES: DecisionStatus[] = ['proposed', 'accepted', 'rejected', 'done']

export interface Income {
  net_monthly: number | null
  kind: IncomeKind
  stability: IncomeStability
  months_per_year: number
  notes: string
}

export interface EmergencyFund {
  target_months: number
  amount: number | null
  account_ids: number[]
  notes: string
}

export interface Debt {
  key: string
  label: string
  kind: DebtKind
  balance: number | null
  annual_rate: number | null
  monthly_payment: number | null
  end_date: string | null
  notes: string
}

export interface Housing {
  status: HousingStatus
  monthly_cost: number | null
  notes: string
}

export interface Household {
  adults: number
  dependents: number
  shared_finances: boolean
  notes: string
}

export interface Pension {
  tfr: TfrChoice
  fund_name: string
  line: string
  annual_contribution: number | null
  employer_contribution: number | null
  notes: string
}

export interface Situation {
  income: Income
  expenses_monthly: number | null
  emergency_fund: EmergencyFund
  debts: Debt[]
  housing: Housing
  household: Household
  pension: Pension
  notes: string
}

export interface Goal {
  key: string
  label: string
  amount: number | null
  target_date: string | null
  horizon_years: number | null
  priority: number
  funding_account_ids: number[]
  status: GoalStatus
  notes: string
}

export interface Risk {
  tolerance: number | null
  tolerance_reason: string
  capacity: number | null
  capacity_reason: string
  experience: Experience
  drawdown_reaction: DrawdownReaction
  notes: string
}

export interface AllocationTarget {
  asset_class: AssetClass
  weight: number
  band: number
  notes: string
}

export interface InvestmentPolicy {
  objective: string
  horizon_years: number | null
  target_allocation: AllocationTarget[]
  rebalance_rule: string
  contribution_plan: string
  constraints: string[]
  review_cadence: ReviewCadence
  notes: string
}

export interface ClientProfile {
  schema_version: number
  situation: Situation
  goals: Goal[]
  risk: Risk
  ips: InvestmentPolicy
  notes: string
}

export interface ProfileResponse {
  workspace_id: number
  version: number
  updated_by: string
  updated_at: string | null
  profile: ClientProfile
  completeness: Record<string, boolean>
  ips_status: IpsStatus
  ips_approved_at: string | null
}

export interface ProfileVersion {
  version: number
  source: string
  created_at: string | null
  profile: ClientProfile
}

export interface Decision {
  id: number
  date: string
  title: string
  rationale: string
  data_refs: string[]
  ips_refs: string[]
  status: DecisionStatus
  profile_version: number | null
  outcome: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DecisionCreate {
  title: string
  rationale: string
  data_refs: string[]
  ips_refs?: string[]
  date?: string
  status?: DecisionStatus
}

export interface DecisionUpdate {
  status?: DecisionStatus
  outcome?: string
  title?: string
  rationale?: string
}

export type CheckSeverity = 'info' | 'warning' | 'critical'

export interface ReviewCheck {
  key: string
  severity: CheckSeverity
  message: string
  data: Record<string, unknown>
}

export interface AdvisorReview {
  as_of: string
  period: { start_date: string; end_date: string; months: number }
  profile: ProfileResponse
  cash_flow: {
    months_requested: number
    months_with_data: number
    income_total: number
    expenses_total: number
    saved_total: number
    income_monthly_avg: number | null
    expenses_monthly_avg: number | null
    saving_rate: number | null
    expenses_coverage: { reviewed_share?: number; total?: number }
    by_month: { month: string; income: number; expenses: number; saved: number }[]
  }
  net_worth: {
    month: string | null
    liquid: number | null
    invested: number | null
    total: number | null
    change_on_previous_month: number | null
    unreconciled_snapshots: number
    accounts: { id: number; name: string; type: string; kind: string }[]
    has_balances: boolean
  }
  investments: {
    net_invested: number | null
    realized_result: number | null
    dividends: number | null
    positions: number
    unresolved_instruments: number
    note: string | null
  }
  emergency_fund: {
    amount: number | null
    basis: 'reported' | 'accounts' | 'unknown'
    monthly_expenses_used: number | null
    target_months: number
    target_amount: number | null
    months_covered: number | null
    shortfall: number | null
  }
  debts: {
    count: number
    balance_total: number
    monthly_payments: number
    expensive_threshold_rate: number
    expensive: { key: string; label: string; balance: number | null; annual_rate: number | null }[]
  }
  allocation: {
    current: { cash: number; invested: number } | null
    target: AllocationTarget[]
    cash_weight_drift: number | null
    note: string
  }
  checks: ReviewCheck[]
  open_decisions: Decision[]
  note: string
}
