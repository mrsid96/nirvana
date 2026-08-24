import type { CommandIntent } from '@/lib/command-bar/types'

export const INTENT_LABELS: Record<CommandIntent, string> = {
  CREATE_GOAL: 'New goal',
  CREATE_ASSET: 'New asset',
  RECORD_INVESTMENT: 'Investment',
  CREATE_RECURRING_INVESTMENT: 'Monthly investment (SIP)',
  RECORD_WITHDRAWAL: 'Withdrawal',
  ADD_EXPENSE: 'Expense',
  ADD_INCOME: 'Income',
  CREATE_LOAN: 'New loan',
  RECORD_LOAN_PAYMENT: 'Loan payment',
  CREATE_RECURRING_EXPENSE: 'Recurring expense',
  SKIP_SCHEDULED_TRANSACTION: 'Skip scheduled transaction',
  OPEN_DASHBOARD: 'Open Home',
  OPEN_WEALTH: 'Open Wealth',
  OPEN_LOANS: 'Open Loans',
  OPEN_PROFILE: 'Open Profile',
  OPEN_GOAL: 'Open goal',
  OPEN_ASSET: 'Open asset',
  OPEN_LOAN: 'Open loan',
  QUERY_MONTHLY_SPENDING: 'Monthly spending',
  QUERY_MONTHLY_INVESTMENT: 'Monthly investments',
  QUERY_GOAL_PROGRESS: 'Goal progress',
  QUERY_LOAN_OUTSTANDING: 'Loan outstanding',
  QUERY_NET_WORTH: 'Net worth',
  QUERY_CASH_FLOW: 'Cash flow',
  UNKNOWN: 'Unknown',
}

export function isFinancialWriteIntent(intent: CommandIntent): boolean {
  return [
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
  ].includes(intent)
}

export function isNavigationIntent(intent: CommandIntent): boolean {
  return [
    'OPEN_DASHBOARD',
    'OPEN_WEALTH',
    'OPEN_LOANS',
    'OPEN_PROFILE',
    'OPEN_GOAL',
    'OPEN_ASSET',
    'OPEN_LOAN',
  ].includes(intent)
}

export function isQueryIntent(intent: CommandIntent): boolean {
  return intent.startsWith('QUERY_')
}

export const PLACEHOLDER_EXAMPLES = [
  'Salary of ₹2.8L came in today',
  'Invested ₹20,000 for retirement',
  'Spent ₹2,400 on groceries',
  'Paid ₹45,000 home loan EMI',
  'Withdraw ₹20,000 from emergency fund',
  'I want to invest ₹50k every month',
] as const

export const CONTEXT_PLACEHOLDERS: Record<string, string> = {
  home: 'What happened with your money?',
  wealth: 'Tell Nirvana about an investment...',
  goal: 'What happened with this goal?',
  loans: 'Tell Nirvana about a loan payment...',
  loan: 'Record a payment or ask about this loan...',
}

/** Intents the user can switch to in edit mode */
export const EDITABLE_WRITE_INTENTS = [
  'ADD_EXPENSE',
  'ADD_INCOME',
  'RECORD_INVESTMENT',
  'RECORD_WITHDRAWAL',
  'RECORD_LOAN_PAYMENT',
  'CREATE_RECURRING_INVESTMENT',
  'CREATE_RECURRING_EXPENSE',
] as const

export type EditableWriteIntent = (typeof EDITABLE_WRITE_INTENTS)[number]
