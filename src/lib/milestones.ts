import { toMinorUnits } from '@/lib/money'
import { calculateGoalMetrics } from '@/lib/calculations/goals'
import { totalOutstanding } from '@/lib/calculations/loans'
import type { MilestoneIconKey } from '@/lib/visual-icons'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'
import type { Loan } from '@/types/loan'
import type { SupportedCurrency } from '@/types/user'

export type Milestone = {
  id: string
  icon: MilestoneIconKey
  title: string
  body: string
}

const WEALTH_THRESHOLDS_INR = [
  { major: 100_000, label: '₹1L' },
  { major: 500_000, label: '₹5L' },
  { major: 1_000_000, label: '₹10L' },
  { major: 5_000_000, label: '₹50L' },
  { major: 10_000_000, label: '₹1Cr' },
]

const WEALTH_THRESHOLDS_USD = [
  { major: 1_000, label: '$1K' },
  { major: 10_000, label: '$10K' },
  { major: 50_000, label: '$50K' },
  { major: 100_000, label: '$100K' },
]

const GOAL_PROGRESS_STEPS = [25, 50, 75, 100]

function wealthThresholds(currency: SupportedCurrency) {
  if (currency === 'INR') return WEALTH_THRESHOLDS_INR
  return WEALTH_THRESHOLDS_USD
}

export function detectMilestones({
  goals,
  assets,
  loans,
  currency,
  asOf,
}: {
  goals: Goal[]
  assets: Asset[]
  loans: Loan[]
  currency: SupportedCurrency
  asOf: string
}): Milestone[] {
  const milestones: Milestone[] = []
  const activeAssets = assets.filter((a) => !a.isDeleted)
  const totalWealth = activeAssets.reduce((sum, a) => sum + a.currentValue, 0)
  const totalInvested = activeAssets.reduce((sum, a) => sum + a.investedAmount, 0)

  const firstInvestThreshold = toMinorUnits(currency === 'INR' ? 100_000 : 1_000, currency)
  if (totalInvested >= firstInvestThreshold) {
    milestones.push({
      id: `invested-${currency === 'INR' ? '1L' : '1K'}`,
      icon: 'celebrate',
      title: currency === 'INR' ? 'First ₹1L invested!' : 'First $1K invested!',
      body: "You've taken a meaningful step toward your future.",
    })
  }

  for (const threshold of wealthThresholds(currency)) {
    const minor = toMinorUnits(threshold.major, currency)
    if (totalWealth >= minor) {
      milestones.push({
        id: `wealth-${threshold.major}`,
        icon: 'rocket',
        title: `Your wealth crossed ${threshold.label}!`,
        body: 'Keep building — momentum is on your side.',
      })
    }
  }

  for (const goal of goals.filter((g) => !g.isDeleted)) {
    const metrics = calculateGoalMetrics(goal, assets, asOf)
    for (const step of GOAL_PROGRESS_STEPS) {
      if (metrics.displayProgressPercent >= step) {
        milestones.push({
          id: `goal-${goal.id}-${step}`,
          icon: step === 100 ? 'trophy' : 'sparkle',
          title:
            step === 100
              ? `${goal.name} — goal complete!`
              : `You've crossed ${step}% of ${goal.name}!`,
          body:
            step === 100
              ? 'What a milestone. Time to celebrate.'
              : "You're making real progress on this goal.",
        })
      }
    }
  }

  const outstanding = totalOutstanding(loans)
  const originalTotal = loans
    .filter((l) => !l.isDeleted)
    .reduce((sum, l) => sum + l.originalAmount, 0)
  if (originalTotal > 0 && outstanding < originalTotal) {
    const paidPercent = ((originalTotal - outstanding) / originalTotal) * 100
    if (paidPercent >= 10) {
      milestones.push({
        id: 'loan-paid-10',
        icon: 'strength',
        title: "You're chipping away at your debt",
        body: `${paidPercent.toFixed(0)}% of your loans paid off. Keep going.`,
      })
    }
  }

  if (activeAssets.length > 0 && goals.length > 0) {
    milestones.push({
      id: 'journey-started',
      icon: 'seedling',
      title: 'Your wealth journey is underway',
      body: `${goals.length} goal${goals.length === 1 ? '' : 's'} · ${activeAssets.length} asset${activeAssets.length === 1 ? '' : 's'} tracked`,
    })
  }

  return milestones
}

export function loadDismissedMilestones(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`milestones-dismissed-${userId}`)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function dismissMilestone(userId: string, milestoneId: string) {
  const dismissed = loadDismissedMilestones(userId)
  dismissed.add(milestoneId)
  localStorage.setItem(`milestones-dismissed-${userId}`, JSON.stringify([...dismissed]))
}
