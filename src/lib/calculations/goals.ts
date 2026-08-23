import {
  futureValueWithMonthlyContributions,
  requiredMonthlyContribution,
} from '@/lib/calculations/cagr'
import { monthsBetween } from '@/lib/formatters/dates'
import type { Asset } from '@/types/asset'
import type { Goal, GoalTrackStatus } from '@/types/goal'
import type { AssetTransaction } from '@/types/transaction'

export interface GoalMetrics {
  targetAmount: number
  currentValue: number
  investedAmount: number
  totalWithdrawals: number
  netInvestedAmount: number
  remainingAmount: number
  progressPercent: number
  displayProgressPercent: number
  monthlyPlannedInvestment: number
  expectedCagr: number
  expectedFutureValue: number
  requiredMonthlyInvestment: number
  monthlyGap: number
  monthsRemaining: number
  projectedCompletionDate: string | null
  trackStatus: GoalTrackStatus
}

export function assetNetInvested(asset: Asset): number {
  return asset.investedAmount - asset.totalWithdrawals
}

export function assetGainLoss(asset: Asset): number {
  return asset.currentValue - assetNetInvested(asset)
}

export function applyTransactionToAsset(
  asset: Asset,
  transaction: Pick<AssetTransaction, 'type' | 'amount'>,
): Asset {
  if (transaction.type === 'INVESTMENT') {
    return {
      ...asset,
      investedAmount: asset.investedAmount + transaction.amount,
      currentValue: asset.currentValue + transaction.amount,
    }
  }
  if (transaction.type === 'WITHDRAWAL') {
    return {
      ...asset,
      totalWithdrawals: asset.totalWithdrawals + transaction.amount,
      currentValue: Math.max(0, asset.currentValue - transaction.amount),
    }
  }
  return { ...asset, currentValue: transaction.amount }
}

export function calculateGoalMetrics(
  goal: Goal,
  assets: Asset[],
  asOfDate: string,
): GoalMetrics {
  const activeAssets = assets.filter((asset) => asset.goalId === goal.id && !asset.isDeleted)
  const currentValue = activeAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const investedAmount = activeAssets.reduce((sum, asset) => sum + asset.investedAmount, 0)
  const totalWithdrawals = activeAssets.reduce(
    (sum, asset) => sum + asset.totalWithdrawals,
    0,
  )
  const netInvestedAmount = investedAmount - totalWithdrawals
  const remainingAmount = goal.targetAmount - currentValue
  const rawProgress = goal.targetAmount <= 0 ? 0 : (currentValue / goal.targetAmount) * 100
  const monthlyPlannedInvestment = activeAssets
    .filter((asset) => asset.isActive)
    .reduce((sum, asset) => sum + (asset.monthlyInvestment ?? 0), 0)
  const weightedCagrNumerator = activeAssets.reduce(
    (sum, asset) => sum + asset.currentValue * (asset.expectedCagr ?? 0),
    0,
  )
  const expectedCagr = currentValue > 0 ? weightedCagrNumerator / currentValue : 0
  const monthsRemaining = Math.max(0, monthsBetween(asOfDate, goal.targetDate))
  const expectedFutureValue = futureValueWithMonthlyContributions({
    presentValue: currentValue,
    monthlyContribution: monthlyPlannedInvestment,
    annualCagr: expectedCagr / 100,
    months: monthsRemaining,
  })
  const requiredMonthly = requiredMonthlyContribution({
    presentValue: currentValue,
    targetValue: goal.targetAmount,
    annualCagr: expectedCagr / 100,
    months: monthsRemaining,
  })

  return {
    targetAmount: goal.targetAmount,
    currentValue,
    investedAmount,
    totalWithdrawals,
    netInvestedAmount,
    remainingAmount,
    progressPercent: rawProgress,
    displayProgressPercent: Math.min(100, Math.max(0, rawProgress)),
    monthlyPlannedInvestment,
    expectedCagr,
    expectedFutureValue,
    requiredMonthlyInvestment: requiredMonthly,
    monthlyGap: requiredMonthly - monthlyPlannedInvestment,
    monthsRemaining,
    projectedCompletionDate: estimateCompletionDate(
      asOfDate,
      currentValue,
      goal.targetAmount,
      monthlyPlannedInvestment,
      expectedCagr,
    ),
    trackStatus: deriveTrackStatus(goal, currentValue, expectedFutureValue, monthsRemaining),
  }
}

function deriveTrackStatus(
  goal: Goal,
  currentValue: number,
  expectedFutureValue: number,
  monthsRemaining: number,
): GoalTrackStatus {
  if (goal.status === 'completed' || currentValue >= goal.targetAmount) {
    return 'Completed'
  }
  if (monthsRemaining <= 0) return 'Behind'
  if (expectedFutureValue >= goal.targetAmount * 1.05) return 'Ahead'
  if (expectedFutureValue >= goal.targetAmount * 0.95) return 'On Track'
  return 'Behind'
}

function estimateCompletionDate(
  asOfDate: string,
  currentValue: number,
  target: number,
  monthly: number,
  cagrPercent: number,
): string | null {
  if (currentValue >= target) return asOfDate
  if (monthly <= 0 && cagrPercent <= 0) return null
  let value = currentValue
  const r = cagrPercent <= 0 ? 0 : (1 + cagrPercent / 100) ** (1 / 12) - 1
  for (let month = 1; month <= 600; month += 1) {
    value = value * (1 + r) + monthly
    if (value >= target) {
      const [year, mo, day] = asOfDate.split('-').map(Number)
      if (!year || !mo || !day) return null
      const date = new Date(year, mo - 1 + month, day)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
  }
  return null
}

export function sipPlanTotals(
  asset: Asset,
  currentYear: number,
  asOf = new Date(),
): { monthly: number; annual: number; remainingThisYear: number } {
  const monthly = asset.monthlyInvestment ?? 0
  if (monthly <= 0) return { monthly: 0, annual: 0, remainingThisYear: 0 }
  const startYear = asset.startDate ? Number(asset.startDate.slice(0, 4)) : currentYear
  const endYear = asset.endDate ? Number(asset.endDate.slice(0, 4)) : undefined
  if (startYear > currentYear || (endYear !== undefined && endYear < currentYear)) {
    return { monthly: 0, annual: 0, remainingThisYear: 0 }
  }
  const remaining =
    asOf.getFullYear() === currentYear ? 12 - asOf.getMonth() : 12
  return { monthly, annual: monthly * 12, remainingThisYear: monthly * remaining }
}

export function weightedGoalProgress(goals: Goal[], assets: Asset[], asOfDate: string): number {
  const active = goals.filter((goal) => !goal.isDeleted && goal.status === 'active')
  const totalTarget = active.reduce((sum, goal) => sum + goal.targetAmount, 0)
  if (totalTarget <= 0) return 0
  return active.reduce((sum, goal) => {
    const metrics = calculateGoalMetrics(goal, assets, asOfDate)
    return sum + metrics.displayProgressPercent * (goal.targetAmount / totalTarget)
  }, 0)
}

export function allocationByGoal(
  goals: Goal[],
  assets: Asset[],
  mode: 'target' | 'current',
): { name: string; value: number }[] {
  return goals
    .filter((goal) => !goal.isDeleted)
    .map((goal) => {
      const metrics = calculateGoalMetrics(goal, assets, goal.startDate)
      return {
        name: goal.name,
        value: mode === 'target' ? goal.targetAmount : metrics.currentValue,
      }
    })
}

export function allocationByCategory(assets: Asset[]): {
  category: Asset['category']
  value: number
  count: number
}[] {
  const map = new Map<Asset['category'], { value: number; count: number }>()
  for (const asset of assets.filter((item) => !item.isDeleted)) {
    const current = map.get(asset.category) ?? { value: 0, count: 0 }
    current.value += asset.currentValue
    current.count += 1
    map.set(asset.category, current)
  }
  return [...map.entries()].map(([category, stats]) => ({ category, ...stats }))
}

export function allocationBySource(assets: Asset[]): {
  source: Asset['source']
  value: number
  count: number
}[] {
  const map = new Map<Asset['source'], { value: number; count: number }>()
  for (const asset of assets.filter((item) => !item.isDeleted)) {
    const current = map.get(asset.source) ?? { value: 0, count: 0 }
    current.value += asset.currentValue
    current.count += 1
    map.set(asset.source, current)
  }
  return [...map.entries()].map(([source, stats]) => ({ source, ...stats }))
}
