import { describe, expect, it } from 'vitest'
import { buildAggregateWealthGrowth, buildGoalProjection, withdrawalsByMonth } from '@/lib/calculations/projections'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'

const goal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'g1',
  name: 'Retirement',
  targetAmount: 5_000_000,
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

describe('goal projection', () => {
  it('projects current value when no contributions', () => {
    const projection = buildGoalProjection(
      goal({ targetAmount: 50_000_000 }),
      [asset({ currentValue: 1_000_000 })],
      '2026-08-01',
      10,
    )
    expect(projection.current).toBe(1_000_000)
    expect(projection.shortfall).toBeGreaterThan(0)
    expect(projection.points.length).toBeGreaterThan(0)
  })

  it('is on track when projected reaches target', () => {
    const projection = buildGoalProjection(
      goal({ targetAmount: 1_100_000 }),
      [asset({ currentValue: 1_000_000, monthlyInvestment: 10_000 })],
      '2026-08-01',
      10,
    )
    expect(projection.onTrack).toBe(true)
    expect(projection.shortfall).toBe(0)
  })

  it('computes monthly withdrawals correctly', () => {
    const result = withdrawalsByMonth([
      { type: 'WITHDRAWAL', amount: 50_000, month: '2026-08', isDeleted: false },
      { type: 'WITHDRAWAL', amount: 20_000, month: '2026-08', isDeleted: false },
      { type: 'INVESTMENT', amount: 10_000, month: '2026-08', isDeleted: false },
      { type: 'WITHDRAWAL', amount: 5_000, month: '2026-09', isDeleted: true },
    ])
    expect(result).toEqual([{ month: '2026-08', value: 70_000 }])
  })

  it('aggregates wealth growth across goals', () => {
    const goals = [
      goal({ id: 'g1', targetAmount: 5_000_000 }),
      goal({ id: 'g2', name: 'Emergency', targetAmount: 1_000_000, targetDate: '2030-01-01' }),
    ]
    const assets = [
      asset({ goalId: 'g1', currentValue: 500_000, monthlyInvestment: 10_000 }),
      asset({ id: 'a2', goalId: 'g2', currentValue: 200_000, monthlyInvestment: 5_000 }),
    ]
    const series = buildAggregateWealthGrowth(goals, assets, '2026-08-01')
    expect(series.length).toBeGreaterThan(0)
    expect(series[0]?.wealth).toBeGreaterThan(0)
    expect(series[0]?.target).toBeGreaterThan(0)
  })
})
