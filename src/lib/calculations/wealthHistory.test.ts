import { describe, expect, it } from 'vitest'
import { buildHistoricalWealthSeries } from '@/lib/calculations/wealthHistory'
import type { Asset } from '@/types/asset'
import type { AssetTransaction } from '@/types/transaction'

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
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
})

describe('historical wealth series', () => {
  it('returns empty when no assets', () => {
    expect(buildHistoricalWealthSeries([], [], '2026-08-23')).toEqual([])
  })

  it('builds series from investments', () => {
    const transactions: AssetTransaction[] = [
      {
        id: 't1',
        assetId: 'a1',
        goalId: 'g1',
        type: 'INVESTMENT',
        amount: 500_000,
        date: '2026-06-15',
        month: '2026-06',
        isDeleted: false,
        createdAt: '2026-06-15T00:00:00.000Z',
      },
      {
        id: 't2',
        assetId: 'a1',
        goalId: 'g1',
        type: 'INVESTMENT',
        amount: 500_000,
        date: '2026-08-10',
        month: '2026-08',
        isDeleted: false,
        createdAt: '2026-08-10T00:00:00.000Z',
      },
    ]
    const series = buildHistoricalWealthSeries([asset()], transactions, '2026-08-23', 3)
    expect(series.length).toBeGreaterThan(0)
    const latest = series.at(-1)
    expect(latest?.wealth).toBe(1_000_000)
  })

  it('uses value update without increasing invested basis', () => {
    const transactions: AssetTransaction[] = [
      {
        id: 't1',
        assetId: 'a1',
        goalId: 'g1',
        type: 'INVESTMENT',
        amount: 1_000_000,
        date: '2026-06-01',
        month: '2026-06',
        isDeleted: false,
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 't2',
        assetId: 'a1',
        goalId: 'g1',
        type: 'VALUE_UPDATE',
        amount: 1_285_000,
        date: '2026-08-23',
        month: '2026-08',
        isDeleted: false,
        createdAt: '2026-08-23T00:00:00.000Z',
      },
    ]
    const series = buildHistoricalWealthSeries([asset()], transactions, '2026-08-23', 2)
    expect(series.at(-1)?.wealth).toBe(1_285_000)
  })
})
