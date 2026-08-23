import type { AssetTransaction } from '@/types/transaction'
import type { Expense } from '@/types/expense'
import type { Income } from '@/types/income'
import type { Loan } from '@/types/loan'

export interface CashFlowBreakdown {
  income: number
  expenses: number
  investments: number
  withdrawals: number
  loanPayments: number
  freeCashFlow: number
}

export function calculateMonthlyCashFlow(params: {
  income: Income[]
  expenses: Expense[]
  transactions: AssetTransaction[]
  loans: Loan[]
  month: string
  includeScheduledEmi?: boolean
  recordedLoanPayments?: number
}): CashFlowBreakdown {
  const income = sumForMonth(params.income, params.month)
  const expenses = sumForMonth(
    params.expenses.filter((item) => item.category !== 'EMI'),
    params.month,
  )
  const investments = params.transactions
    .filter((tx) => !tx.isDeleted && tx.type === 'INVESTMENT' && tx.month === params.month)
    .reduce((sum, tx) => sum + tx.amount, 0)
  const withdrawals = params.transactions
    .filter((tx) => !tx.isDeleted && tx.type === 'WITHDRAWAL' && tx.month === params.month)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const recorded =
    params.recordedLoanPayments ??
    sumForMonth(
      params.expenses.filter((item) => item.category === 'EMI'),
      params.month,
    )
  const scheduled = params.includeScheduledEmi
    ? params.loans
        .filter((loan) => !loan.isDeleted && loan.status === 'ACTIVE')
        .reduce((sum, loan) => sum + loan.emiAmount, 0)
    : 0
  const loanPayments = recorded > 0 ? recorded : scheduled

  return {
    income,
    expenses,
    investments,
    withdrawals,
    loanPayments,
    freeCashFlow: income - expenses - loanPayments - investments + withdrawals,
  }
}

function sumForMonth(items: { amount: number; month: string; isDeleted: boolean }[], month: string): number {
  return items
    .filter((item) => !item.isDeleted && item.month === month)
    .reduce((sum, item) => sum + item.amount, 0)
}
