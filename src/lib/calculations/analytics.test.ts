import { describe, expect, it } from 'vitest'
import {
  totalWithdrawals,
  withdrawalsByAssetMap,
  withdrawalsByGoalMap,
} from '@/lib/calculations/analytics'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'
import type { AssetTransaction } from '@/types/transaction'

const goal = (): Goal => ({
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
})

const asset = (): Asset => ({
  id: 'a1',
  goalId: 'g1',
  name: 'Index fund',
  category: 'MF',
  source: 'ZERODHA',
  investmentType: 'SIP',
  investedAmount: 1_000_000,
  currentValue: 900_000,
  totalWithdrawals: 100_000,
  isActive: true,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('withdrawal analytics', () => {
  const transactions: AssetTransaction[] = [
    {
      id: 't1',
      assetId: 'a1',
      goalId: 'g1',
      type: 'WITHDRAWAL',
      amount: 150_000,
      date: '2026-08-01',
      month: '2026-08',
      isDeleted: false,
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 't2',
      assetId: 'a1',
      goalId: 'g1',
      type: 'WITHDRAWAL',
      amount: 60_000,
      date: '2026-08-15',
      month: '2026-08',
      isDeleted: false,
      createdAt: '2026-08-15T00:00:00.000Z',
    },
  ]

  it('totals withdrawals', () => {
    expect(totalWithdrawals(transactions)).toBe(210_000)
  })

  it('groups withdrawals by goal id', () => {
    const byGoal = withdrawalsByGoalMap([goal()], transactions)
    expect(byGoal).toEqual([{ name: 'Retirement', value: 210_000 }])
  })

  it('groups withdrawals by asset id', () => {
    const byAsset = withdrawalsByAssetMap([asset()], transactions)
    expect(byAsset).toEqual([{ name: 'Index fund', value: 210_000 }])
  })
})
