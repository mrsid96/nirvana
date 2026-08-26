import { splitCompoundInput } from '@/lib/command-bar/compound'
import { extractExpenseCategory } from '@/lib/command-bar/entities'
import {
  parseExpenseEntities,
  withdrawClauseAmount,
} from '@/lib/command-bar/expense-entity-parser'
import type {
  AssetActionData,
  EntityParseResult,
  GoalActionData,
  ParsedFinancialAction,
} from '@/lib/command-bar/entity-model'
import { parseGoalEntities, refineGoalNameFromText } from '@/lib/command-bar/goal-entity-parser'
import { parseIncomeEntities } from '@/lib/command-bar/income-entity-parser'
import { parseLoanEntities } from '@/lib/command-bar/loan-entity-parser'
import { parseWithdrawEntities } from '@/lib/command-bar/withdraw-entity-parser'
import type { ParserContext } from '@/lib/command-bar/types'

type ClauseParser = (text: string, context: ParserContext) => ParsedFinancialAction[]

const CLAUSE_PARSERS: ClauseParser[] = [
  parseLoanEntities,
  parseWithdrawEntities,
  parseGoalEntities,
  parseIncomeEntities,
  parseExpenseEntities,
]

function parseClause(text: string, context: ParserContext): ParsedFinancialAction[] {
  const actions: ParsedFinancialAction[] = []
  for (const parser of CLAUSE_PARSERS) {
    actions.push(...parser(text, context))
  }
  return actions
}

function dedupeActions(actions: ParsedFinancialAction[]): ParsedFinancialAction[] {
  const seen = new Set<string>()
  return actions.filter((action) => {
    const key = `${action.entity}:${action.action}:${JSON.stringify(action.data)}:${action.parent?.reference ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function linkCompoundActions(actions: ParsedFinancialAction[]): ParsedFinancialAction[] {
  let lastGoalRef: string | undefined

  for (const action of actions) {
    if (action.entity === 'GOAL') {
      lastGoalRef = (action.data as GoalActionData).name
    }
    if (action.entity === 'ASSET' && !action.parent && lastGoalRef) {
      action.parent = { entity: 'GOAL', reference: lastGoalRef }
    }
  }

  return actions
}

function refineCompoundGoals(
  actions: ParsedFinancialAction[],
  fullText: string,
): ParsedFinancialAction[] {
  for (const action of actions) {
    if (action.entity === 'GOAL') {
      const goalData = action.data as GoalActionData
      goalData.name = refineGoalNameFromText(fullText, goalData.name)
    }
  }
  return actions
}

function inferBreakdownFrequency(
  actions: ParsedFinancialAction[],
  fullText: string,
): ParsedFinancialAction[] {
  const isMonthlyBreakdown =
    /\b(a month|per month|every month|monthly)\b/i.test(fullText) &&
    actions.filter((action) => ['INCOME', 'EXPENSE', 'LOAN'].includes(action.entity)).length >= 2

  if (!isMonthlyBreakdown) return actions

  for (const action of actions) {
    if (action.entity === 'INCOME' || action.entity === 'EXPENSE') {
      ;(action.data as { frequency?: string }).frequency = 'monthly'
    }
    if (action.entity === 'LOAN' && (action.data as { emi?: number }).emi) {
      ;(action.data as { frequency?: string }).frequency = 'monthly'
    }
  }

  return actions
}

function detectUnresolved(actions: ParsedFinancialAction[], fullText: string): string[] {
  const unresolved: string[] = []
  const monthlyAssets = actions.filter(
    (action) =>
      action.entity === 'ASSET' && (action.data as AssetActionData).frequency === 'monthly',
  )
  const withoutAmount = monthlyAssets.filter(
    (action) => (action.data as AssetActionData).contribution_amount == null,
  )
  if (withoutAmount.length >= 2 && /\bmix\b/i.test(fullText)) {
    unresolved.push('asset_allocation')
  }
  return unresolved
}

function ensureWithdrawFollowUpExpense(
  actions: ParsedFinancialAction[],
  fullText: string,
  context: ParserContext,
): ParsedFinancialAction[] {
  const hasWithdraw = actions.some((action) => action.entity === 'WITHDRAW')
  const hasExpense = actions.some((action) => action.entity === 'EXPENSE')
  if (!hasWithdraw || hasExpense) return actions
  if (!/\b(withdraw|withdrew|redeemed)\b/i.test(fullText)) return actions
  if (!/\b(spent|used it to pay|used it on)\b/i.test(fullText)) return actions

  const amount = withdrawClauseAmount(fullText, context.currency)
  if (!amount) return actions

  actions.push({
    entity: 'EXPENSE',
    action: 'CREATE',
    data: {
      amount,
      category: extractExpenseCategory(fullText),
      date: undefined,
    },
    confidence: 0.88,
  })

  return actions
}

export function parseFinancialEntities(text: string, context: ParserContext): EntityParseResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { actions: [], parserMethod: 'entity-empty' }
  }

  const clauses = splitCompoundInput(trimmed)
  const allActions: ParsedFinancialAction[] = []

  if (clauses.length > 1) {
    for (const clause of clauses) {
      allActions.push(...parseClause(clause, context))
    }
    if (allActions.length > 0) {
      const linked = inferBreakdownFrequency(
        ensureWithdrawFollowUpExpense(
          refineCompoundGoals(linkCompoundActions(allActions), trimmed),
          trimmed,
          context,
        ),
        trimmed,
      )
      return {
        actions: dedupeActions(linked),
        parserMethod: 'entity-compound',
        unresolved: detectUnresolved(linked, trimmed),
      }
    }
  }

  const single = parseClause(trimmed, context)
  if (single.length > 0) {
    return {
      actions: single,
      parserMethod: 'entity',
      unresolved: detectUnresolved(single, trimmed),
    }
  }

  return { actions: [], parserMethod: 'entity-none' }
}
