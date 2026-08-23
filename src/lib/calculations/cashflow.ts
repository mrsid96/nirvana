import type { AssetTransaction } from '@/types/transaction'
import type { Expense } from '@/types/expense'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import type { MonthlySummary } from '@/types/monthlySummary'

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
  loanPayments?: LoanPayment[]
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

  const recordedFromPayments = params.loanPayments
    ? sumForMonth(params.loanPayments, params.month)
    : 0
  const recordedFromEmiExpenses = sumForMonth(
    params.expenses.filter((item) => item.category === 'EMI'),
    params.month,
  )
  const recorded =
    params.recordedLoanPayments ??
    (recordedFromPayments > 0 ? recordedFromPayments : recordedFromEmiExpenses)
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

export function cashFlowFromMonthlySummary(
  summary: MonthlySummary | null | undefined,
  loans: Loan[],
  includeScheduledEmi = true,
): CashFlowBreakdown | null {
  if (!summary) return null
  const scheduled = includeScheduledEmi
    ? loans
        .filter((loan) => !loan.isDeleted && loan.status === 'ACTIVE')
        .reduce((sum, loan) => sum + loan.emiAmount, 0)
    : 0
  const loanPayments = summary.loanPayments > 0 ? summary.loanPayments : scheduled
  return {
    income: summary.income,
    expenses: summary.expenses,
    investments: summary.investments,
    withdrawals: summary.withdrawals,
    loanPayments,
    freeCashFlow:
      summary.income - summary.expenses - loanPayments - summary.investments + summary.withdrawals,
  }
}

function sumForMonth(items: { amount: number; month: string; isDeleted: boolean }[], month: string): number {
  return items
    .filter((item) => !item.isDeleted && item.month === month)
    .reduce((sum, item) => sum + item.amount, 0)
}
