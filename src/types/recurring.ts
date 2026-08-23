import type { ExpenseCategory } from './expense'

export type RecurringActivityType = 'INVESTMENT' | 'LOAN_PAYMENT' | 'INCOME' | 'EXPENSE'

export type RecurringFrequency = 'MONTHLY'

export type RecurringActivityStatus = 'ACTIVE' | 'PAUSED'

export type OccurrenceStatus = 'UPCOMING' | 'DUE' | 'OVERDUE' | 'RECORDED' | 'SKIPPED'

export interface RecurringActivity {
  id: string
  userId?: string
  type: RecurringActivityType
  name: string
  amount: number
  frequency: RecurringFrequency
  scheduledDay: number
  startDate: string
  endDate?: string
  goalId?: string
  assetId?: string
  loanId?: string
  expenseCategory?: ExpenseCategory
  incomeSource?: string
  status: RecurringActivityStatus
  /** Links auto-generated rules back to their source entity */
  sourceEntityId?: string
  sourceEntityType?: 'asset' | 'loan' | 'manual'
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

/** Persisted in `recurringRules`. Same shape as RecurringActivity. */
export type RecurringRule = RecurringActivity

export type OccurrenceSyncState = 'PENDING' | 'SYNCED'

export interface ScheduledOccurrence {
  id: string
  userId?: string
  recurringActivityId: string
  type: RecurringActivityType
  name: string
  expectedAmount: number
  scheduledDate: string
  month?: string
  status: OccurrenceStatus
  goalId?: string
  assetId?: string
  loanId?: string
  expenseCategory?: ExpenseCategory
  incomeSource?: string
  actualTransactionId?: string
  actualLoanPaymentId?: string
  actualExpenseId?: string
  actualIncomeId?: string
  actualAmount?: number
  actualDate?: string
  skipReason?: string
  recordedAt?: string
  syncState?: OccurrenceSyncState
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}
