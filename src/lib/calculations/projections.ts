import { futureValueWithMonthlyContributions } from '@/lib/calculations/cagr'
import { monthsBetween } from '@/lib/formatters/dates'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'

export interface ProjectionPoint {
  label: string
  projected: number
  target: number
}

export interface GoalProjection {
  current: number
  projected: number
  target: number
  shortfall: number
  onTrack: boolean
  points: ProjectionPoint[]
}

export function buildGoalProjection(
  goal: Goal,
  assets: Asset[],
  asOfDate: string,
  monthlyCagrPercent: number,
  points = 6,
): GoalProjection {
  const activeAssets = assets.filter(
    (asset) => asset.goalId === goal.id && !asset.isDeleted,
  )
  const current = activeAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const monthly = activeAssets
    .filter((asset) => asset.isActive)
    .reduce((sum, asset) => sum + (asset.monthlyInvestment ?? 0), 0)
  const monthsRemaining = Math.max(0, monthsBetween(asOfDate, goal.targetDate))

  const projected = futureValueWithMonthlyContributions({
    presentValue: current,
    monthlyContribution: monthly,
    annualCagr: monthlyCagrPercent / 100,
    months: monthsRemaining,
  })
  const shortfall = Math.max(0, goal.targetAmount - projected)
  const onTrack = projected >= goal.targetAmount

  const step = Math.max(1, Math.ceil(monthsRemaining / points))
  const pointList: ProjectionPoint[] = []
  for (let offset = 0; offset <= monthsRemaining; offset += step) {
    const projectedAtPoint = futureValueWithMonthlyContributions({
      presentValue: current,
      monthlyContribution: monthly,
      annualCagr: monthlyCagrPercent / 100,
      months: offset,
    })
    // Straight-line target: from current value to targetAmount over remaining months.
    const targetAtPoint =
      goal.targetAmount <= current
        ? goal.targetAmount
        : current +
          (goal.targetAmount - current) * (offset / Math.max(1, monthsRemaining))
    pointList.push({
      label: buildPointLabel(asOfDate, offset),
      projected: projectedAtPoint,
      target: targetAtPoint,
    })
    if (offset >= monthsRemaining) break
  }
  if (pointList.length === 0) {
    pointList.push({
      label: 'Today',
      projected: current,
      target: Math.min(goal.targetAmount, current),
    })
  }

  return {
    current,
    projected,
    target: goal.targetAmount,
    shortfall,
    onTrack,
    points: pointList,
  }
}

function buildPointLabel(asOfDate: string, monthsAhead: number): string {
  if (monthsAhead <= 0) return 'Today'
  const [year, month] = asOfDate.split('-').map(Number)
  if (!year || !month) return `${monthsAhead}m`
  const date = new Date(year, month - 1 + monthsAhead, 1)
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' }).format(
    date,
  )
}

export function withdrawalsByMonth(
  transactions: { type: string; amount: number; month: string; isDeleted: boolean }[],
): { month: string; value: number }[] {
  const map = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.isDeleted || tx.type !== 'WITHDRAWAL') continue
    map.set(tx.month, (map.get(tx.month) ?? 0) + tx.amount)
  }
  return [...map.entries()]
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function withdrawalsByAsset(
  transactions: { assetId: string; amount: number; type: string; isDeleted: boolean }[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.isDeleted || tx.type !== 'WITHDRAWAL') continue
    map.set(tx.assetId, (map.get(tx.assetId) ?? 0) + tx.amount)
  }
  return map
}

export interface WealthGrowthPoint {
  label: string
  wealth: number
  target: number
}

/** Aggregate projected wealth vs combined goal targets for the dashboard chart. */
export function buildAggregateWealthGrowth(
  goals: Goal[],
  assets: Asset[],
  asOfDate: string,
  defaultCagrPercent = 11,
  points = 6,
): WealthGrowthPoint[] {
  const activeGoals = goals.filter((goal) => !goal.isDeleted && goal.status === 'active')
  if (activeGoals.length === 0) return []

  const projections = activeGoals.map((goal) => {
    const goalAssets = assets.filter((asset) => asset.goalId === goal.id && !asset.isDeleted)
    const cagr =
      goalAssets.find((asset) => asset.expectedCagr != null)?.expectedCagr ?? defaultCagrPercent
    return buildGoalProjection(goal, assets, asOfDate, cagr, points)
  })

  const maxLen = Math.max(...projections.map((item) => item.points.length))
  const merged: WealthGrowthPoint[] = []
  for (let index = 0; index < maxLen; index += 1) {
    let wealth = 0
    let target = 0
    let label = 'Today'
    for (const projection of projections) {
      const point = projection.points[index] ?? projection.points.at(-1)
      if (!point) continue
      wealth += point.projected
      target += point.target
      label = point.label
    }
    merged.push({ label, wealth, target })
  }
  return merged
}
