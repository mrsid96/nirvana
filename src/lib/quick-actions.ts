import { ArrowDownLeft, ArrowUpRight, Landmark, type LucideIcon } from 'lucide-react'

export type QuickSheet =
  | 'expense'
  | 'income'
  | 'investment'
  | 'withdrawal'
  | 'loan-payment'
  | null

export const quickActions: {
  key: Exclude<QuickSheet, null>
  label: string
  shortLabel: string
  icon: LucideIcon
  color: string
}[] = [
  { key: 'expense', label: 'Expense', shortLabel: 'Expense', icon: ArrowUpRight, color: 'bg-peach/15 text-peach' },
  { key: 'income', label: 'Income', shortLabel: 'Income', icon: ArrowDownLeft, color: 'bg-mint/15 text-mint' },
  { key: 'investment', label: 'Investment', shortLabel: 'Invest', icon: ArrowUpRight, color: 'bg-accent/15 text-accent' },
  { key: 'withdrawal', label: 'Withdrawal', shortLabel: 'Withdraw', icon: ArrowDownLeft, color: 'bg-yellow/20 text-[#C9A030]' },
  { key: 'loan-payment', label: 'Loan payment', shortLabel: 'Loan pay', icon: Landmark, color: 'bg-sky/15 text-sky' },
]

export function getQuickSheetTitle(sheet: Exclude<QuickSheet, null>) {
  const titles: Record<Exclude<QuickSheet, null>, string> = {
    expense: 'Add expense',
    income: 'Add income',
    investment: 'Add investment',
    withdrawal: 'Record withdrawal',
    'loan-payment': 'Loan payment',
  }
  return titles[sheet]
}

export function getQuickSheetSuccessMessage(sheet: Exclude<QuickSheet, null>) {
  const messages: Record<Exclude<QuickSheet, null>, string> = {
    expense: 'Expense logged.',
    income: 'Income added. Nice.',
    investment: 'Investment added. Nice move.',
    withdrawal: 'Withdrawal recorded.',
    'loan-payment': 'Payment recorded. Debt going down.',
  }
  return messages[sheet]
}
