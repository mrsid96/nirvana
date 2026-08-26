/** Top-level financial entities in Nirvana's data model. */
export type FinancialEntity = 'INCOME' | 'EXPENSE' | 'GOAL' | 'LOAN' | 'WITHDRAW'

/** Asset instrument types (nested under GOAL only). */
export type AssetInstrumentType =
  | 'unknown'
  | 'mutual_fund'
  | 'sip'
  | 'rd'
  | 'fd'
  | 'savings'
  | 'stocks'
  | 'gold'
  | 'cash'
  | 'property'
  | 'index_fund'
  | 'emergency_fund'
  | 'vacation_fund'
  | 'car_fund'
  | 'retirement_investment'
  | 'house_savings'
  | 'investment'
  | 'other'

export type EntityAction = 'CREATE' | 'CREATE_OR_RESOLVE' | 'UPDATE' | 'RECORD'

export type Frequency = 'one_time' | 'monthly' | 'yearly'

export interface GoalActionData {
  name: string
  target_amount?: number
  target_date?: string
  tenure?: string
  category?: string
}

export interface AssetActionData {
  type: AssetInstrumentType
  name?: string
  current_value?: number
  contribution_amount?: number
  frequency?: Frequency
}

export interface IncomeActionData {
  type?: string
  amount?: number
  frequency?: Frequency
  date?: string
  source?: string
  category?: string
}

export interface ExpenseActionData {
  category?: string
  amount?: number
  frequency?: Frequency
  date?: string
  merchant?: string
}

export interface LoanActionData {
  type?: string
  amount?: number
  outstanding_amount?: number
  interest_rate?: number
  emi?: number
  frequency?: Frequency
  tenure?: string
  lender?: string
  repayment?: number
  date?: string
}

export interface WithdrawActionData {
  amount?: number
  asset?: AssetInstrumentType | string
  goal?: string
  date?: string
  reason?: string
  early_withdrawal?: boolean
}

export type ParsedActionData =
  | GoalActionData
  | AssetActionData
  | IncomeActionData
  | ExpenseActionData
  | LoanActionData
  | WithdrawActionData

export interface ParsedFinancialAction {
  entity: FinancialEntity | 'ASSET'
  action: EntityAction
  data: ParsedActionData
  parent?: {
    entity: 'GOAL'
    reference: string
  }
  confidence: number
}

export interface EntityParseResult {
  actions: ParsedFinancialAction[]
  parserMethod: string
  unresolved?: string[]
}
