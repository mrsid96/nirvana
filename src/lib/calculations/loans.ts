import type { Loan } from '@/types/loan'

export interface LoanMetrics {
  originalAmount: number
  outstandingAmount: number
  paidAmount: number
  progressPercent: number
  remainingMonths: number
  emiAmount: number
}

export function calculateLoanMetrics(loan: Loan, asOfDate: string): LoanMetrics {
  const paidAmount = Math.max(0, loan.originalAmount - loan.outstandingAmount)
  const progressPercent =
    loan.originalAmount <= 0 ? 0 : (paidAmount / loan.originalAmount) * 100
  const elapsed = monthsElapsed(loan.startDate, asOfDate)
  const remainingMonths =
    loan.status === 'CLOSED' ? 0 : Math.max(0, loan.tenureMonths - elapsed)

  return {
    originalAmount: loan.originalAmount,
    outstandingAmount: loan.outstandingAmount,
    paidAmount,
    progressPercent,
    remainingMonths,
    emiAmount: loan.emiAmount,
  }
}

function monthsElapsed(startDate: string, asOfDate: string): number {
  const [sy, sm] = startDate.split('-').map(Number)
  const [ey, em] = asOfDate.split('-').map(Number)
  if (!sy || !sm || !ey || !em) return 0
  return Math.max(0, (ey - sy) * 12 + (em - sm))
}

export function totalOutstanding(loans: Loan[]): number {
  return activeLoans(loans).reduce((sum, loan) => sum + loan.outstandingAmount, 0)
}

export function totalOriginal(loans: Loan[]): number {
  return visibleLoans(loans).reduce((sum, loan) => sum + loan.originalAmount, 0)
}

export function totalPaid(loans: Loan[]): number {
  return visibleLoans(loans).reduce(
    (sum, loan) => sum + Math.max(0, loan.originalAmount - loan.outstandingAmount),
    0,
  )
}

export function totalMonthlyEmi(loans: Loan[]): number {
  return activeLoans(loans).reduce((sum, loan) => sum + loan.emiAmount, 0)
}

export function loanBurdenRatio(monthlyEmi: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0
  return (monthlyEmi / monthlyIncome) * 100
}

function visibleLoans(loans: Loan[]): Loan[] {
  return loans.filter((loan) => !loan.isDeleted)
}

function activeLoans(loans: Loan[]): Loan[] {
  return visibleLoans(loans).filter((loan) => loan.status === 'ACTIVE')
}
