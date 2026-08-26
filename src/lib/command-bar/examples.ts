import type { CommandIntent } from '@/lib/command-bar/types'

export interface CommandExample {
  id: string
  label: string
  phrase: string
  intent: CommandIntent
}

export interface CommandExampleCategory {
  id: string
  label: string
  description: string
  examples: CommandExample[]
}

export const COMMAND_GUIDE_CATEGORIES: CommandExampleCategory[] = [
  {
    id: 'income',
    label: 'Income',
    description: 'Salary, bonus, freelance payments',
    examples: [
      { id: 'inc-1', label: 'Salary', phrase: 'Salary of ₹2.8L came in today', intent: 'ADD_INCOME' },
      { id: 'inc-2', label: 'Bonus', phrase: 'Received ₹50,000 bonus today', intent: 'ADD_INCOME' },
    ],
  },
  {
    id: 'expense',
    label: 'Expense',
    description: 'Spending, purchases, bills',
    examples: [
      { id: 'exp-1', label: 'Groceries', phrase: 'Spent ₹2,400 on groceries', intent: 'ADD_EXPENSE' },
      { id: 'exp-2', label: 'Shopping', phrase: 'Bought clothes for ₹8,500 today', intent: 'ADD_EXPENSE' },
    ],
  },
  {
    id: 'invest',
    label: 'Invest',
    description: 'One-time or monthly investments',
    examples: [
      { id: 'inv-1', label: 'Lump sum', phrase: 'Invested ₹50,000 in retirement today', intent: 'RECORD_INVESTMENT' },
      { id: 'inv-2', label: 'Monthly SIP', phrase: 'Invest ₹10k every month in mutual fund', intent: 'CREATE_RECURRING_INVESTMENT' },
    ],
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    description: 'Redemptions from goals or assets',
    examples: [
      { id: 'wd-1', label: 'Emergency', phrase: 'Withdraw ₹20,000 from emergency fund', intent: 'RECORD_WITHDRAWAL' },
    ],
  },
  {
    id: 'loan-pay',
    label: 'Loan payment',
    description: 'EMI or loan repayments you already made',
    examples: [
      { id: 'lp-1', label: 'EMI paid', phrase: 'Paid ₹45,000 home loan EMI today', intent: 'RECORD_LOAN_PAYMENT' },
    ],
  },
  {
    id: 'loan-new',
    label: 'New loan',
    description: 'Loans you took or are setting up',
    examples: [
      {
        id: 'ln-1',
        label: 'Interior loan',
        phrase: 'Took a loan for home interiors, paying ₹15,000 per month for 15 months',
        intent: 'CREATE_LOAN',
      },
      {
        id: 'ln-2',
        label: 'Car loan',
        phrase: 'Create a car loan of ₹8 lakh, EMI ₹18,000 every month',
        intent: 'CREATE_LOAN',
      },
    ],
  },
  {
    id: 'goal',
    label: 'Goal',
    description: 'Savings targets with optional monthly investing',
    examples: [
      { id: 'gl-1', label: 'Retirement', phrase: 'Create retirement goal for ₹1 crore', intent: 'CREATE_GOAL' },
      {
        id: 'gl-2',
        label: 'Goal + SIP',
        phrase: 'I want a bike for ₹3L, invest ₹10k every month in mutual fund',
        intent: 'CREATE_GOAL_WITH_ASSET',
      },
      {
        id: 'gl-3',
        label: 'Gift goal',
        phrase: 'Gift myself an S26 Ultra, put ₹15k aside every month in a mutual fund',
        intent: 'CREATE_GOAL_WITH_ASSET',
      },
      {
        id: 'gl-4',
        label: 'Timed purchase',
        phrase:
          'I want to buy furniture worth ₹2L 1 year from now, save ₹15k per month',
        intent: 'CREATE_GOAL_WITH_ASSET',
      },
    ],
  },
  {
    id: 'query',
    label: 'Ask',
    description: 'Questions about your finances',
    examples: [
      { id: 'q-1', label: 'Spending', phrase: 'How much did I spend this month?', intent: 'QUERY_MONTHLY_SPENDING' },
      { id: 'q-2', label: 'Goal progress', phrase: 'Show my retirement progress', intent: 'QUERY_GOAL_PROGRESS' },
    ],
  },
]

export const QUICK_INTENT_OPTIONS: Array<{ id: CommandIntent; label: string }> = [
  { id: 'ADD_INCOME', label: 'Record income' },
  { id: 'ADD_EXPENSE', label: 'Record expense' },
  { id: 'RECORD_INVESTMENT', label: 'Record investment' },
  { id: 'RECORD_WITHDRAWAL', label: 'Record withdrawal' },
  { id: 'RECORD_LOAN_PAYMENT', label: 'Loan payment' },
  { id: 'CREATE_LOAN', label: 'Set up a loan' },
  { id: 'CREATE_GOAL', label: 'Create a goal' },
  { id: 'CREATE_GOAL_WITH_ASSET', label: 'Goal + monthly SIP' },
]
