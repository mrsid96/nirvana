import type { Asset } from '@/types/asset'
import type { AssetTransaction } from '@/types/transaction'
import type { Goal } from '@/types/goal'

export interface AllocationDatum {
  name: string
  value: number
}

export function allocationByGoal(goals: Goal[], assets: Asset[]): AllocationDatum[] {
  const map = new Map<string, number>()
  for (const asset of assets) {
    if (asset.isDeleted) continue
    const goal = goals.find((item) => item.id === asset.goalId)
    if (!goal) continue
    map.set(goal.name, (map.get(goal.name) ?? 0) + asset.currentValue)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function allocationByCategory(assets: Asset[]): AllocationDatum[] {
  const map = new Map<string, number>()
  for (const asset of assets) {
    if (asset.isDeleted) continue
    map.set(asset.category, (map.get(asset.category) ?? 0) + asset.currentValue)
  }
  return [...map.entries()]
    .map(([category, value]) => ({ name: category, value }))
    .sort((a, b) => b.value - a.value)
}

export function allocationBySource(assets: Asset[]): AllocationDatum[] {
  const map = new Map<string, number>()
  for (const asset of assets) {
    if (asset.isDeleted) continue
    map.set(asset.source, (map.get(asset.source) ?? 0) + asset.currentValue)
  }
  return [...map.entries()]
    .map(([source, value]) => ({ name: source, value }))
    .sort((a, b) => b.value - a.value)
}

export function withdrawalsByMonth(
  transactions: AssetTransaction[],
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

export function withdrawalsByGoalMap(
  goals: Goal[],
  transactions: AssetTransaction[],
): { name: string; value: number }[] {
  const idToName = new Map(goals.map((goal) => [goal.id, goal.name]))
  const map = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.isDeleted || tx.type !== 'WITHDRAWAL') continue
    const goalName = idToName.get(tx.assetId) ?? 'Unknown'
    map.set(goalName, (map.get(goalName) ?? 0) + tx.amount)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function byCategory(assets: Asset[]): AllocationDatum[] {
  const map = new Map<string, number>()
  for (const asset of assets) {
    if (asset.isDeleted) continue
    map.set(asset.category, (map.get(asset.category) ?? 0) + asset.currentValue)
  }
  return [...map.entries()]
    .map(([category, value]) => ({ name: category, value }))
    .sort((a, b) => b.value - a.value)
}
