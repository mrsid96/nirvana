export type LoanStatus = 'ACTIVE' | 'CLOSED'

export interface Loan {
  id: string
  userId?: string
  name: string
  description?: string
  purpose?: string
  bank: string
  originalAmount: number
  outstandingAmount: number
  totalPaid?: number
  progressPercentage?: number
  interestRate: number
  tenureMonths: number
  startDate: string
  endDate?: string
  emiAmount: number
  emiDate: number
  deductionBank: string
  status: LoanStatus
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface LoanPayment {
  id: string
  userId?: string
  loanId: string
  amount: number
  principalAmount?: number
  interestAmount?: number
  date: string
  month: string
  note?: string
  isDeleted: boolean
  createdAt: string
  updatedAt?: string
}
