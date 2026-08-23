import { describe, expect, it } from 'vitest'
import {
  deriveOccurrenceStatus,
  generateOccurrenceDates,
  groupOccurrencesByMonth,
  mergeRecurringActivities,
  occurrenceId,
  scheduledDateForMonth,
  syncOccurrences,
} from '@/lib/calculations/recurring'
import type { Asset } from '@/types/asset'
import type { Loan } from '@/types/loan'
import type { RecurringActivity, ScheduledOccurrence } from '@/types/recurring'

const asset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 'a1',
  goalId: 'g1',
  name: 'Retirement SIP',
  category: 'MF',
  source: 'ZERODHA',
  investmentType: 'SIP',
  investedAmount: 0,
  currentValue: 0,
  totalWithdrawals: 0,
  monthlyInvestment: 50_000,
  plannedInvestmentDay: 5,
  isActive: true,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const loan = (overrides: Partial<Loan> = {}): Loan => ({
  id: 'l1',
  name: 'Home Loan',
  bank: 'HDFC',
  originalAmount: 10_000_000,
  outstandingAmount: 9_000_000,
  interestRate: 8,
  tenureMonths: 240,
  startDate: '2024-01-01',
  emiAmount: 103_000,
  emiDate: 7,
  deductionBank: 'HDFC',
  status: 'ACTIVE',
  isDeleted: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

describe('scheduledDateForMonth', () => {
  it('uses last valid day for February when scheduled on 31st', () => {
    expect(scheduledDateForMonth(2026, 1, 31)).toBe('2026-02-28')
  })

  it('uses Feb 29 in a leap year', () => {
    expect(scheduledDateForMonth(2024, 1, 31)).toBe('2024-02-29')
  })

  it('uses 30th for April when scheduled on 31st', () => {
    expect(scheduledDateForMonth(2026, 3, 31)).toBe('2026-04-30')
  })

  it('keeps 31st for May', () => {
    expect(scheduledDateForMonth(2026, 4, 31)).toBe('2026-05-31')
  })
})

describe('occurrence status', () => {
  it('marks future dates as upcoming', () => {
    expect(deriveOccurrenceStatus('2026-09-05', undefined, '2026-08-23')).toBe('UPCOMING')
  })

  it('marks today as due', () => {
    expect(deriveOccurrenceStatus('2026-08-23', undefined, '2026-08-23')).toBe('DUE')
  })

  it('marks past unrecorded dates as overdue', () => {
    expect(deriveOccurrenceStatus('2026-08-05', undefined, '2026-08-23')).toBe('OVERDUE')
  })

  it('preserves recorded status', () => {
    expect(deriveOccurrenceStatus('2026-08-05', 'RECORDED', '2026-08-23')).toBe('RECORDED')
  })

  it('preserves skipped status', () => {
    expect(deriveOccurrenceStatus('2026-08-05', 'SKIPPED', '2026-08-23')).toBe('SKIPPED')
  })
})

describe('merge recurring activities', () => {
  it('derives SIP from assets and EMI from loans', () => {
    const merged = mergeRecurringActivities([], [asset()], [loan()])
    expect(merged.length).toBe(2)
    expect(merged.find((item) => item.type === 'INVESTMENT')?.amount).toBe(50_000)
    expect(merged.find((item) => item.type === 'LOAN_PAYMENT')?.amount).toBe(103_000)
  })

  it('ignores inactive assets', () => {
    const merged = mergeRecurringActivities(
      [],
      [asset({ isActive: false })],
      [],
    )
    expect(merged.length).toBe(0)
  })
})

describe('sync occurrences', () => {
  it('creates due occurrence when today matches schedule', () => {
    const activities = mergeRecurringActivities([], [asset({ plannedInvestmentDay: 23 })], [])
    const synced = syncOccurrences(activities, [], '2026-08-23')
    const due = synced.find((item) => item.scheduledDate === '2026-08-23')
    expect(due?.status).toBe('DUE')
  })

  it('creates overdue occurrence when user opens app late', () => {
    const activities = mergeRecurringActivities([], [asset({ plannedInvestmentDay: 5 })], [])
    const synced = syncOccurrences(activities, [], '2026-08-10')
    const overdue = synced.find((item) => item.scheduledDate === '2026-08-05')
    expect(overdue?.status).toBe('OVERDUE')
  })

  it('does not duplicate occurrences on repeated sync', () => {
    const activities = mergeRecurringActivities([], [asset()], [])
    const first = syncOccurrences(activities, [], '2026-08-05')
    const second = syncOccurrences(activities, first, '2026-08-05')
    const ids = second.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const august = second.filter((item) => item.scheduledDate === '2026-08-05')
    expect(august.length).toBe(1)
  })

  it('keeps skipped occurrences out of action required', () => {
    const activities = mergeRecurringActivities([], [asset()], [])
    const id = occurrenceId('asset_a1', '2026-08-05')
    const skipped: ScheduledOccurrence = {
      id,
      recurringActivityId: 'asset_a1',
      type: 'INVESTMENT',
      name: 'Retirement SIP',
      expectedAmount: 50_000,
      scheduledDate: '2026-08-05',
      status: 'SKIPPED',
      goalId: 'g1',
      assetId: 'a1',
      isDeleted: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    }
    const synced = syncOccurrences(activities, [skipped], '2026-08-10')
    const item = synced.find((entry) => entry.id === id)
    expect(item?.status).toBe('SKIPPED')
  })
})

describe('generateOccurrenceDates', () => {
  const activity: RecurringActivity = {
    id: 'manual_1',
    type: 'INCOME',
    name: 'Salary',
    amount: 350_000,
    frequency: 'MONTHLY',
    scheduledDay: 30,
    startDate: '2026-01-01',
    status: 'ACTIVE',
    sourceEntityType: 'manual',
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  it('generates monthly dates within window', () => {
    const dates = generateOccurrenceDates(activity, '2026-08-01', '2026-10-31')
    expect(dates).toContain('2026-08-30')
    expect(dates).toContain('2026-09-30')
    expect(dates).toContain('2026-10-30')
  })

  it('groups calendar months', () => {
    const occurrences = [
      {
        id: 'o1',
        recurringActivityId: 'a1',
        type: 'INVESTMENT' as const,
        name: 'SIP',
        expectedAmount: 50_000,
        scheduledDate: '2026-08-05',
        status: 'UPCOMING' as const,
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'o2',
        recurringActivityId: 'a1',
        type: 'LOAN_PAYMENT' as const,
        name: 'EMI',
        expectedAmount: 103_000,
        scheduledDate: '2026-08-07',
        status: 'UPCOMING' as const,
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const groups = groupOccurrencesByMonth(occurrences, '2026-08', 2)
    expect(groups[0]?.items.length).toBe(2)
    expect(groups[1]?.items.length).toBe(0)
  })
})
