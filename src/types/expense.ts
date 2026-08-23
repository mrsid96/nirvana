export const EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Home',
  'Travel',
  'EMI',
  'Insurance',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const PAYMENT_SOURCES = ['Cash', 'Bank', 'Credit Card', 'UPI', 'Other'] as const
export type PaymentSource = (typeof PAYMENT_SOURCES)[number]

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  description?: string
  date: string
  month: string
  paymentSource?: PaymentSource
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}
