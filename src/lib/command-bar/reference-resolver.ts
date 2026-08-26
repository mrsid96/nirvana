import type { ParserContext } from '@/lib/command-bar/types'

export interface ResolvedReference {
  goalName?: string
  goalId?: string
  assetName?: string
  assetId?: string
}

export function hasPronounReference(text: string): boolean {
  return /\b(?:to|from|into)\s+it\b|\b(?:it|this|that|the same)\b/i.test(text)
}

export function resolveReference(text: string, context: ParserContext): ResolvedReference {
  if (!hasPronounReference(text) && !context.currentGoalId && !context.currentAssetId) {
    return {}
  }

  const result: ResolvedReference = {}

  if (context.currentGoalId) {
    const goal = context.goals.find((g) => g.id === context.currentGoalId)
    if (goal) {
      result.goalId = goal.id
      result.goalName = goal.name
    }
  }

  if (context.currentAssetId) {
    const asset = context.assets.find((a) => a.id === context.currentAssetId)
    if (asset) {
      result.assetId = asset.id
      result.assetName = asset.name
      if (!result.goalId) {
        const goal = context.goals.find((g) => g.id === asset.goalId)
        if (goal) {
          result.goalId = goal.id
          result.goalName = goal.name
        }
      }
    }
  }

  if (hasPronounReference(text) && !result.goalName && context.goals.length === 1) {
    result.goalId = context.goals[0]!.id
    result.goalName = context.goals[0]!.name
  }

  if (hasPronounReference(text) && !result.assetName && context.assets.length === 1) {
    result.assetId = context.assets[0]!.id
    result.assetName = context.assets[0]!.name
    if (!result.goalName) {
      const goal = context.goals.find((g) => g.id === context.assets[0]!.goalId)
      if (goal) {
        result.goalId = goal.id
        result.goalName = goal.name
      }
    }
  }

  return result
}
