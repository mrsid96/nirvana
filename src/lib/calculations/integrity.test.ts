import { describe, expect, it } from 'vitest'
import {
  filterActiveRecords,
  goalWealthMatchesAssets,
  netWorth,
  totalWealthFromAssets,
} from '@/lib/calculations/integrity'
import { calculateGoalMetrics } from '@/lib/calculations/goals'
import { totalWithdrawals } from '@/lib/calculations/analytics'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'
import type { Loan } from '@/types/loan'
import type { AssetTransaction } from '@/types/transaction'

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
  investedAmount: 1_000_000,
  currentValue: 1_200_000,
  totalWithdrawals: 0,
  isActive: true,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('data integrity', () => {
  it('excludes soft-deleted assets from wealth total', () => {
    const total = totalWealthFromAssets([
      asset({ currentValue: 500_000 }),
      asset({ id: 'a2', currentValue: 300_000, isDeleted: true }),
    ])
    expect(total).toBe(500_000)
  })

  it('keeps goal wealth aligned with asset sum', () => {
    const assets = [
      asset({ currentValue: 800_000 }),
      asset({ id: 'a2', currentValue: 400_000 }),
    ]
    expect(goalWealthMatchesAssets(goal(), assets, '2026-08-01')).toBe(true)
    expect(calculateGoalMetrics(goal(), assets, '2026-08-01').currentValue).toBe(1_200_000)
  })

  it('computes net worth from assets minus loans', () => {
    const loans: Loan[] = [
      {
        id: 'l1',
        name: 'Home',
        bank: 'HDFC',
        originalAmount: 5_000_000,
        outstandingAmount: 3_000_000,
        interestRate: 8,
        tenureMonths: 120,
        startDate: '2024-01-01',
        emiAmount: 50_000,
        emiDate: 5,
        deductionBank: 'HDFC',
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]
    expect(netWorth([asset({ currentValue: 5_000_000 })], loans)).toBe(2_000_000)
  })

  it('excludes deleted transactions from analytics', () => {
    const txs: AssetTransaction[] = [
      {
        id: 't1',
        assetId: 'a1',
        goalId: 'g1',
        type: 'WITHDRAWAL',
        amount: 100_000,
        date: '2026-08-01',
        month: '2026-08',
        isDeleted: false,
        createdAt: '',
      },
      {
        id: 't2',
        assetId: 'a1',
        goalId: 'g1',
        type: 'WITHDRAWAL',
        amount: 50_000,
        date: '2026-08-02',
        month: '2026-08',
        isDeleted: true,
        createdAt: '',
      },
    ]
    expect(totalWithdrawals(txs)).toBe(100_000)
  })

  it('filters soft-deleted records', () => {
    expect(filterActiveRecords([{ isDeleted: false }, { isDeleted: true }])).toHaveLength(1)
  })
})
