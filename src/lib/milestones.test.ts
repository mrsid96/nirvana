import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  detectMilestones,
  dismissMilestone,
  loadDismissedMilestones,
} from '@/lib/milestones'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'

const goal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'g1',
  name: 'Retirement',
  targetAmount: 1_000_000,
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
  name: 'Fund',
  category: 'MF',
  source: 'ZERODHA',
  investmentType: 'SIP',
  investedAmount: 10_000_000,
  currentValue: 10_000_000,
  totalWithdrawals: 0,
  isActive: true,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('milestones', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    })
  })

  it('detects first investment milestone', () => {
    const milestones = detectMilestones({
      goals: [goal()],
      assets: [asset()],
      loans: [],
      currency: 'INR',
      asOf: '2026-08-01',
    })
    expect(milestones.some((m) => m.id === 'invested-1L')).toBe(true)
  })

  it('does not re-show dismissed milestones', () => {
    const userId = 'user-test'
    dismissMilestone(userId, 'invested-1L')
    const dismissed = loadDismissedMilestones(userId)
    expect(dismissed.has('invested-1L')).toBe(true)

    const milestones = detectMilestones({
      goals: [goal()],
      assets: [asset()],
      loans: [],
      currency: 'INR',
      asOf: '2026-08-01',
    })
    const visible = milestones.filter((m) => !dismissed.has(m.id))
    expect(visible.some((m) => m.id === 'invested-1L')).toBe(false)
  })
})
