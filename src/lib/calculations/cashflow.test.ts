import { describe, expect, it } from 'vitest'
import { calculateMonthlyCashFlow } from '@/lib/calculations/cashflow'
import type { Expense } from '@/types/expense'
import type { Income } from '@/types/income'
import type { Loan } from '@/types/loan'
import type { LoanPayment } from '@/types/loan'
import type { AssetTransaction } from '@/types/transaction'

const income = (amount: number): Income => ({
  id: 'i1',
  amount,
  source: 'Salary',
  date: '2026-08-01',
  month: '2026-08',
  isDeleted: false,
  createdAt: '2026-08-01T00:00:00.000Z',
})

const expense = (amount: number): Expense => ({
  id: 'e1',
  amount,
  category: 'Food',
  date: '2026-08-02',
  month: '2026-08',
  isDeleted: false,
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
})

const tx = (type: AssetTransaction['type'], amount: number): AssetTransaction => ({
  id: 't1',
  assetId: 'a1',
  goalId: 'g1',
  type,
  amount,
  date: '2026-08-05',
  month: '2026-08',
  isDeleted: false,
  createdAt: '2026-08-05T00:00:00.000Z',
})

const loan = (): Loan => ({
  id: 'l1',
  name: 'Home',
  bank: 'HDFC',
  originalAmount: 1_000_000,
  outstandingAmount: 900_000,
  interestRate: 8,
  tenureMonths: 120,
  startDate: '2024-01-01',
  emiAmount: 75_000,
  emiDate: 5,
  deductionBank: 'HDFC',
  status: 'ACTIVE',
  isDeleted: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
})

describe('monthly cash flow', () => {
  it('uses income only', () => {
    expect(
      calculateMonthlyCashFlow({
        income: [income(400_000)],
        expenses: [],
        transactions: [],
        loans: [],
        month: '2026-08',
      }).freeCashFlow,
    ).toBe(400_000)
  })

  it('subtracts expenses only', () => {
    const result = calculateMonthlyCashFlow({
      income: [],
      expenses: [expense(80_000)],
      transactions: [],
      loans: [],
      month: '2026-08',
    })
    expect(result.expenses).toBe(80_000)
    expect(result.freeCashFlow).toBe(-80_000)
  })

  it('treats investments as a wealth-building outflow', () => {
    const result = calculateMonthlyCashFlow({
      income: [income(400_000)],
      expenses: [expense(80_000)],
      transactions: [tx('INVESTMENT', 100_000)],
      loans: [],
      month: '2026-08',
    })
    expect(result.investments).toBe(100_000)
    expect(result.freeCashFlow).toBe(220_000)
  })

  it('adds withdrawals back to free cash flow', () => {
    expect(
      calculateMonthlyCashFlow({
        income: [income(400_000)],
        expenses: [],
        transactions: [tx('WITHDRAWAL', 50_000)],
        loans: [],
        month: '2026-08',
      }).freeCashFlow,
    ).toBe(450_000)
  })

  it('uses scheduled EMI when no loan payment is recorded', () => {
    const result = calculateMonthlyCashFlow({
      income: [income(400_000)],
      expenses: [expense(80_000)],
      transactions: [tx('INVESTMENT', 100_000)],
      loans: [loan()],
      month: '2026-08',
      includeScheduledEmi: true,
    })
    expect(result.loanPayments).toBe(75_000)
    expect(result.freeCashFlow).toBe(145_000)
  })

  it('prefers recorded loan payments over scheduled EMI', () => {
    const payment: LoanPayment = {
      id: 'p1',
      loanId: 'l1',
      amount: 80_000,
      date: '2026-08-07',
      month: '2026-08',
      isDeleted: false,
      createdAt: '2026-08-07T00:00:00.000Z',
    }
    const result = calculateMonthlyCashFlow({
      income: [income(400_000)],
      expenses: [],
      transactions: [],
      loans: [loan()],
      loanPayments: [payment],
      month: '2026-08',
      includeScheduledEmi: true,
    })
    expect(result.loanPayments).toBe(80_000)
    expect(result.freeCashFlow).toBe(320_000)
  })

  it('excludes EMI category from spending totals', () => {
    const emiExpense: Expense = {
      id: 'e2',
      amount: 75_000,
      category: 'EMI',
      date: '2026-08-03',
      month: '2026-08',
      isDeleted: false,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
    }
    const result = calculateMonthlyCashFlow({
      income: [income(400_000)],
      expenses: [expense(80_000), emiExpense],
      transactions: [],
      loans: [],
      month: '2026-08',
    })
    expect(result.expenses).toBe(80_000)
    expect(result.loanPayments).toBe(75_000)
  })
})
