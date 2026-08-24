import type { ExpenseCategory } from '@/types/expense'
import type { SupportedCurrency } from '@/types/user'

export const COMMAND_INTENTS = [
  'CREATE_GOAL',
  'CREATE_ASSET',
  'RECORD_INVESTMENT',
  'CREATE_RECURRING_INVESTMENT',
  'RECORD_WITHDRAWAL',
  'ADD_EXPENSE',
  'ADD_INCOME',
  'CREATE_LOAN',
  'RECORD_LOAN_PAYMENT',
  'CREATE_RECURRING_EXPENSE',
  'SKIP_SCHEDULED_TRANSACTION',
  'OPEN_DASHBOARD',
  'OPEN_WEALTH',
  'OPEN_LOANS',
  'OPEN_PROFILE',
  'OPEN_GOAL',
  'OPEN_ASSET',
  'OPEN_LOAN',
  'QUERY_MONTHLY_SPENDING',
  'QUERY_MONTHLY_INVESTMENT',
  'QUERY_GOAL_PROGRESS',
  'QUERY_LOAN_OUTSTANDING',
  'QUERY_NET_WORTH',
  'QUERY_CASH_FLOW',
  'UNKNOWN',
] as const

export type CommandIntent = (typeof COMMAND_INTENTS)[number]

export type ParserPhase = 'needs_clarification' | 'needs_confirmation' | 'ready' | 'unknown'

export type ClarificationKind =
  | 'missing_goal'
  | 'missing_asset'
  | 'missing_loan'
  | 'ambiguous_goal'
  | 'ambiguous_asset'
  | 'ambiguous_loan'
  | 'ambiguous_intent'
  | 'missing_amount'

export interface ClarificationOption {
  id: string
  label: string
  type: 'goal' | 'asset' | 'loan' | 'action' | 'create' | 'occurrence'
}

export interface Clarification {
  kind: ClarificationKind
  question: string
  options: ClarificationOption[]
}

export interface QueryResult {
  title: string
  value: string
  subtitle?: string
}

export interface StructuredIntent {
  intent: CommandIntent
  confidence: number
  amount?: number
  currency?: SupportedCurrency
  date?: string
  goalId?: string
  goalName?: string
  assetId?: string
  assetName?: string
  loanId?: string
  loanName?: string
  category?: ExpenseCategory | string
  source?: string
  frequency?: 'MONTHLY'
  dayOfMonth?: number
  description?: string
  navigationPath?: string
  queryResult?: QueryResult
  parserMethod?: string
  scheduledOccurrenceId?: string
  scheduledOccurrenceName?: string
  targetDate?: string
  priority?: 'low' | 'medium' | 'high'
  assetCategory?: string
  investmentType?: 'SIP' | 'LUMP_SUM' | 'BOTH'
  monthlyInvestment?: number
  expectedCagr?: number
  bank?: string
  purpose?: string
  originalAmount?: number
  outstandingAmount?: number
  emiAmount?: number
  interestRate?: number
  tenureMonths?: number
  startDate?: string
}

export interface ScheduledOccurrenceRef {
  id: string
  name: string
  status: string
}

export interface ParseResult {
  input: string
  structured: StructuredIntent
  phase: ParserPhase
  clarification?: Clarification
  durationMs?: number
}

export interface ParserContext {
  currency: SupportedCurrency
  goals: Array<{ id: string; name: string }>
  assets: Array<{ id: string; name: string; goalId: string }>
  loans: Array<{ id: string; name: string }>
  currentGoalId?: string
  currentAssetId?: string
  currentLoanId?: string
  today?: string
  scheduledOccurrences?: ScheduledOccurrenceRef[]
}

export interface FinanceSnapshot {
  goals: Array<{ id: string; name: string; targetAmount: number; currentValue?: number }>
  assets: Array<{ id: string; name: string; goalId: string; currentValue: number }>
  loans: Array<{ id: string; name: string; outstandingAmount: number }>
  income: Array<{ amount: number; month: string }>
  expenses: Array<{ amount: number; month: string; category: string }>
  transactions: Array<{ amount: number; month: string; type: string }>
  loanPayments: Array<{ amount: number; month: string }>
  currentMonth: string
  netWorth: number
  cashFlow: {
    income: number
    expenses: number
    investments: number
    freeCashFlow: number
    loanPayments: number
  }
}
