import { calculateGoalMetrics } from '@/lib/calculations/goals'
import { totalOutstanding } from '@/lib/calculations/loans'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'
import type { Loan } from '@/types/loan'

/** Sum of non-deleted asset current values — single source for total wealth. */
export function totalWealthFromAssets(assets: Asset[]): number {
  return assets.filter((asset) => !asset.isDeleted).reduce((sum, asset) => sum + asset.currentValue, 0)
}

/** Goal current value must match sum of its assets. */
export function goalWealthMatchesAssets(goal: Goal, assets: Asset[], asOf: string): boolean {
  const metrics = calculateGoalMetrics(goal, assets, asOf)
  const assetSum = assets
    .filter((asset) => asset.goalId === goal.id && !asset.isDeleted)
    .reduce((sum, asset) => sum + asset.currentValue, 0)
  return metrics.currentValue === assetSum
}

export function netWorth(assets: Asset[], loans: Loan[]): number {
  return totalWealthFromAssets(assets) - totalOutstanding(loans)
}

export function filterActiveRecords<T extends { isDeleted: boolean }>(items: T[]): T[] {
  return items.filter((item) => !item.isDeleted)
}
