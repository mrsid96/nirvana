import { describe, expect, it } from 'vitest'
import { calculateMonthlyCashFlow } from '@/lib/calculations/cashflow'
import { calculateGoalMetrics, assetGainLoss, assetNetInvested, applyTransactionToAsset } from '@/lib/calculations/goals'
import { calculateLoanMetrics } from '@/lib/calculations/loans'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'
import type { Loan } from '@/types/loan'

const goal = (): Goal => ({
  id: 'g1',
  name: 'Retirement',
  targetAmount: 10_000_000,
  startDate: '2026-01-01',
  targetDate: '2045-01-01',
  priority: 'high',
  status: 'active',
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const asset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 'a1',
  goalId: 'g1',
  name: 'Fund',
  category: 'MF',
  source: 'ZERODHA',
  investmentType: 'SIP',
  investedAmount: 0,
  currentValue: 0,
  totalWithdrawals: 0,
  isActive: true,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('scenario: goal investment journey', () => {
  it('tracks goal progress after investment', () => {
    let current = asset()
    current = applyTransactionToAsset(current, { type: 'INVESTMENT', amount: 2_500_000 })
    const metrics = calculateGoalMetrics(goal(), [current], '2026-08-01')
    expect(metrics.currentValue).toBe(2_500_000)
    expect(metrics.displayProgressPercent).toBe(25)
    expect(metrics.investedAmount).toBe(2_500_000)
  })
})

describe('scenario: withdrawal journey', () => {
  it('reduces current value without increasing invested amount', () => {
    let current = asset({ investedAmount: 1_000_000, currentValue: 1_200_000 })
    current = applyTransactionToAsset(current, { type: 'WITHDRAWAL', amount: 100_000 })
    expect(current.totalWithdrawals).toBe(100_000)
    expect(current.investedAmount).toBe(1_000_000)
    expect(current.currentValue).toBe(1_100_000)
    expect(assetNetInvested(current)).toBe(900_000)
    expect(assetGainLoss(current)).toBe(200_000)
  })
})

describe('scenario: loan payment journey', () => {
  it('reflects partial payoff', () => {
    const loan: Loan = {
      id: 'l1',
      name: 'Home',
      bank: 'HDFC',
      originalAmount: 11_200_000,
      outstandingAmount: 9_840_000,
      interestRate: 7.4,
      tenureMonths: 240,
      startDate: '2020-01-01',
      emiAmount: 103_000,
      emiDate: 5,
      deductionBank: 'HDFC',
      status: 'ACTIVE',
      isDeleted: false,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    }
    const metrics = calculateLoanMetrics(loan, '2026-08-01')
    expect(metrics.paidAmount).toBe(1_360_000)
    expect(metrics.outstandingAmount).toBe(9_840_000)
  })
})

describe('scenario: monthly cash flow', () => {
  it('combines income, spending, investments, loans, and withdrawals', () => {
    const result = calculateMonthlyCashFlow({
      income: [{ id: 'i', amount: 400_000, source: 'Salary', date: '2026-08-01', month: '2026-08', isDeleted: false, createdAt: '' }],
      expenses: [{ id: 'e', amount: 80_000, category: 'Food', date: '2026-08-02', month: '2026-08', isDeleted: false, createdAt: '', updatedAt: '' }],
      transactions: [
        { id: 't1', assetId: 'a1', goalId: 'g1', type: 'INVESTMENT', amount: 100_000, date: '2026-08-05', month: '2026-08', isDeleted: false, createdAt: '' },
        { id: 't2', assetId: 'a1', goalId: 'g1', type: 'WITHDRAWAL', amount: 50_000, date: '2026-08-10', month: '2026-08', isDeleted: false, createdAt: '' },
      ],
      loans: [{
        id: 'l1', name: 'Home', bank: 'HDFC', originalAmount: 1_000_000, outstandingAmount: 900_000,
        interestRate: 8, tenureMonths: 120, startDate: '2024-01-01', emiAmount: 75_000, emiDate: 5,
        deductionBank: 'HDFC', status: 'ACTIVE', isDeleted: false, createdAt: '', updatedAt: '',
      }],
      loanPayments: [{ id: 'p1', loanId: 'l1', amount: 75_000, date: '2026-08-05', month: '2026-08', isDeleted: false, createdAt: '' }],
      month: '2026-08',
      includeScheduledEmi: true,
    })
    expect(result.freeCashFlow).toBe(400_000 - 80_000 - 75_000 - 100_000 + 50_000)
  })
})
