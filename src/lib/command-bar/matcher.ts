import type { ClarificationOption, ParserContext } from '@/lib/command-bar/types'

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function scoreMatch(hint: string, name: string): number {
  const h = normalize(hint)
  const n = normalize(name)
  if (n === h) return 1
  if (n.includes(h) || h.includes(n)) return 0.85
  const hWords = h.split(' ')
  const nWords = n.split(' ')
  const overlap = hWords.filter((w) => nWords.some((nw) => nw.includes(w) || w.includes(nw))).length
  if (overlap > 0) return 0.5 + overlap * 0.15
  return 0
}

export interface MatchResult<T> {
  match?: T
  matches: T[]
  ambiguous: boolean
}

export function matchGoals(
  hint: string | undefined,
  context: ParserContext,
): MatchResult<{ id: string; name: string }> {
  const active = context.goals
  if (!hint) {
    if (context.currentGoalId) {
      const current = active.find((g) => g.id === context.currentGoalId)
      if (current) return { match: current, matches: [current], ambiguous: false }
    }
    return { matches: [], ambiguous: false }
  }

  const scored = active
    .map((g) => ({ item: g, score: scoreMatch(hint, g.name) }))
    .filter((s) => s.score >= 0.5)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return { matches: [], ambiguous: false }
  if (scored.length === 1) {
    const top = scored[0]!
    return { match: top.item, matches: [top.item], ambiguous: false }
  }
  const first = scored[0]!
  const second = scored[1]!
  if (first.score >= 1 || first.score - second.score > 0.15) {
    return { match: first.item, matches: [first.item], ambiguous: false }
  }
  return { matches: scored.map((s) => s.item), ambiguous: true }
}

export function matchAssets(
  hint: string | undefined,
  goalId: string | undefined,
  context: ParserContext,
): MatchResult<{ id: string; name: string; goalId: string }> {
  let pool = context.assets
  if (goalId) pool = pool.filter((a) => a.goalId === goalId)

  if (!hint) {
    if (context.currentAssetId) {
      const current = pool.find((a) => a.id === context.currentAssetId)
      if (current) return { match: current, matches: [current], ambiguous: false }
    }
    if (pool.length === 1) {
      const only = pool[0]!
      return { match: only, matches: [only], ambiguous: false }
    }
    return { matches: pool, ambiguous: pool.length > 1 }
  }

  const scored = pool
    .map((a) => ({ item: a, score: scoreMatch(hint, a.name) }))
    .filter((s) => s.score >= 0.5)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return { matches: pool, ambiguous: pool.length > 1 }
  if (scored.length === 1) {
    const top = scored[0]!
    return { match: top.item, matches: [top.item], ambiguous: false }
  }
  const first = scored[0]!
  const second = scored[1]!
  if (first.score >= 1 || first.score - second.score > 0.15) {
    return { match: first.item, matches: [first.item], ambiguous: false }
  }
  return { matches: scored.map((s) => s.item), ambiguous: true }
}

export function matchLoans(
  hint: string | undefined,
  context: ParserContext,
): MatchResult<{ id: string; name: string }> {
  const active = context.loans
  if (!hint) {
    if (context.currentLoanId) {
      const current = active.find((l) => l.id === context.currentLoanId)
      if (current) return { match: current, matches: [current], ambiguous: false }
    }
    if (active.length === 1) {
      const only = active[0]!
      return { match: only, matches: [only], ambiguous: false }
    }
    return { matches: active, ambiguous: active.length > 1 }
  }

  const scored = active
    .map((l) => ({ item: l, score: scoreMatch(hint, l.name) }))
    .filter((s) => s.score >= 0.5)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return { matches: active, ambiguous: active.length > 1 }
  if (scored.length === 1) {
    const top = scored[0]!
    return { match: top.item, matches: [top.item], ambiguous: false }
  }
  const first = scored[0]!
  const second = scored[1]!
  if (first.score >= 1 || first.score - second.score > 0.15) {
    return { match: first.item, matches: [first.item], ambiguous: false }
  }
  return { matches: scored.map((s) => s.item), ambiguous: true }
}

export function toGoalOptions(goals: Array<{ id: string; name: string }>): ClarificationOption[] {
  const options: ClarificationOption[] = goals.map((g) => ({ id: g.id, label: g.name, type: 'goal' }))
  options.push({ id: '__create__', label: 'Create new goal', type: 'create' })
  return options
}

export function toAssetOptions(
  assets: Array<{ id: string; name: string }>,
): ClarificationOption[] {
  const options: ClarificationOption[] = assets.map((a) => ({ id: a.id, label: a.name, type: 'asset' }))
  options.push({ id: '__create__', label: 'Create new asset', type: 'create' })
  return options
}

export function toLoanOptions(loans: Array<{ id: string; name: string }>): ClarificationOption[] {
  const options: ClarificationOption[] = loans.map((l) => ({ id: l.id, label: l.name, type: 'loan' }))
  options.push({ id: '__create__', label: 'Create new loan', type: 'create' })
  return options
}
