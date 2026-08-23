import { describe, expect, it } from 'vitest'
import { calculateGoalMetrics } from '@/lib/calculations/goals'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'

const goal = (overrides: Partial<Goal> = {}): Goal => ({
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
  ...overrides,
})

const asset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 'a1',
  goalId: 'g1',
  name: 'Index fund',
  category: 'MF',
  source: 'ZERODHA',
  investmentType: 'SIP',
  investedAmount: 0,
  currentValue: 0,
  totalWithdrawals: 0,
  expectedCagr: 12,
  monthlyInvestment: 0,
  isActive: true,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('goal progress', () => {
  it('is zero when nothing is invested', () => {
    const metrics = calculateGoalMetrics(goal(), [], '2026-08-01')
    expect(metrics.progressPercent).toBe(0)
    expect(metrics.displayProgressPercent).toBe(0)
  })

  it('is partial for a fraction of the target', () => {
    const metrics = calculateGoalMetrics(goal(), [asset({ currentValue: 2_500_000 })], '2026-08-01')
    expect(metrics.progressPercent).toBe(25)
    expect(metrics.displayProgressPercent).toBe(25)
  })

  it('is complete at target', () => {
    const metrics = calculateGoalMetrics(goal(), [asset({ currentValue: 10_000_000 })], '2026-08-01')
    expect(metrics.progressPercent).toBe(100)
    expect(metrics.trackStatus).toBe('Completed')
  })

  it('caps displayed progress at 100% when over target', () => {
    const metrics = calculateGoalMetrics(goal(), [asset({ currentValue: 12_000_000 })], '2026-08-01')
    expect(metrics.progressPercent).toBe(120)
    expect(metrics.displayProgressPercent).toBe(100)
  })

  it('keeps invested, current value, and withdrawals separate', () => {
    const metrics = calculateGoalMetrics(
      goal(),
      [
        asset({
          investedAmount: 1_000_000,
          currentValue: 1_200_000,
          totalWithdrawals: 100_000,
        }),
      ],
      '2026-08-01',
    )
    expect(metrics.investedAmount).toBe(1_000_000)
    expect(metrics.currentValue).toBe(1_200_000)
    expect(metrics.totalWithdrawals).toBe(100_000)
    expect(metrics.netInvestedAmount).toBe(900_000)
  })
})
