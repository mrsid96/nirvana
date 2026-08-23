import { describe, expect, it } from 'vitest'
import { calculateLoanMetrics, loanBurdenRatio, totalMonthlyEmi } from '@/lib/calculations/loans'
import type { Loan } from '@/types/loan'

const loan = (overrides: Partial<Loan> = {}): Loan => ({
  id: 'l1',
  name: 'Home Loan',
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
  ...overrides,
})

describe('loan progress', () => {
  it('is 100% paid when outstanding is zero', () => {
    const metrics = calculateLoanMetrics(loan({ outstandingAmount: 0 }), '2026-08-01')
    expect(metrics.paidAmount).toBe(11_200_000)
    expect(metrics.progressPercent).toBe(100)
  })

  it('is 0% paid when outstanding equals original', () => {
    const metrics = calculateLoanMetrics(loan({ outstandingAmount: 11_200_000 }), '2026-08-01')
    expect(metrics.paidAmount).toBe(0)
    expect(metrics.progressPercent).toBe(0)
  })

  it('computes partial payment', () => {
    const metrics = calculateLoanMetrics(loan(), '2026-08-01')
    expect(metrics.paidAmount).toBe(1_360_000)
    expect(metrics.progressPercent).toBeCloseTo(12.14, 1)
  })

  it('sums active EMI and burden ratio', () => {
    expect(
      totalMonthlyEmi([loan(), loan({ id: 'l2', emiAmount: 20_000, status: 'CLOSED' })]),
    ).toBe(103_000)
    expect(loanBurdenRatio(75_000, 400_000)).toBeCloseTo(18.75, 2)
  })
})
