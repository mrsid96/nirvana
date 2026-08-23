export const INCOME_SOURCES = [
  'Salary',
  'Bonus',
  'Freelance',
  'Interest',
  'Other',
] as const

export type IncomeSource = (typeof INCOME_SOURCES)[number]

export interface Income {
  id: string
  amount: number
  source: string
  description?: string
  date: string
  month: string
  isDeleted: boolean
  createdAt: string
}
