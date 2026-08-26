import {
  assetInstrumentLabel,
  assetInstrumentToCategory,
} from '@/lib/command-bar/asset-instrument'
import type {
  AssetActionData,
  EntityParseResult,
  GoalActionData,
  ParsedFinancialAction,
} from '@/lib/command-bar/entity-model'
import { addMonthsIso, todayIsoDate } from '@/lib/formatters/dates'
import type { CommandIntent, StructuredIntent } from '@/lib/command-bar/types'
import type { ParserContext } from '@/lib/command-bar/types'

function findGoal(actions: ParsedFinancialAction[]): ParsedFinancialAction | undefined {
  return actions.find((a) => a.entity === 'GOAL')
}

function findAssets(actions: ParsedFinancialAction[]): ParsedFinancialAction[] {
  return actions.filter((a) => a.entity === 'ASSET')
}

function findRecurringAsset(assets: ParsedFinancialAction[]): ParsedFinancialAction | undefined {
  return assets.find((a) => (a.data as AssetActionData).contribution_amount != null)
}

export function entityActionsToStructuredIntent(
  result: EntityParseResult,
  context: ParserContext,
): StructuredIntent | null {
  const { actions } = result
  if (actions.length === 0) return null

  const today = context.today ?? todayIsoDate()
  const top = actions[0]!

  if (top.entity === 'INCOME') {
    return {
      intent: 'ADD_INCOME',
      confidence: top.confidence,
      parserMethod: result.parserMethod,
      amount: top.data.amount,
      category: top.data.type,
      date: top.data.date,
      frequency: top.data.frequency === 'monthly' ? 'MONTHLY' : undefined,
      currency: context.currency,
    }
  }

  if (top.entity === 'EXPENSE') {
    return {
      intent: 'ADD_EXPENSE',
      confidence: top.confidence,
      parserMethod: result.parserMethod,
      amount: top.data.amount,
      category: top.data.category,
      date: top.data.date,
      frequency: top.data.frequency === 'monthly' ? 'MONTHLY' : undefined,
      currency: context.currency,
    }
  }

  if (top.entity === 'WITHDRAW') {
    return {
      intent: 'RECORD_WITHDRAWAL',
      confidence: top.confidence,
      parserMethod: result.parserMethod,
      amount: top.data.amount,
      goalName: top.data.goal,
      assetName: typeof top.data.asset === 'string' ? top.data.asset : undefined,
      date: top.data.date,
      currency: context.currency,
    }
  }

  if (top.entity === 'LOAN') {
    if (top.action === 'UPDATE') {
      return {
        intent: 'RECORD_LOAN_PAYMENT',
        confidence: top.confidence,
        parserMethod: result.parserMethod,
        amount: top.data.repayment,
        date: top.data.date,
        currency: context.currency,
      }
    }
    return {
      intent: 'CREATE_LOAN',
      confidence: top.confidence,
      parserMethod: result.parserMethod,
      loanName: top.data.type?.replace(/_/g, ' ') ?? 'New loan',
      originalAmount: top.data.amount ?? top.data.outstanding_amount,
      outstandingAmount: top.data.outstanding_amount ?? top.data.amount,
      emiAmount: top.data.emi,
      tenureMonths: top.data.tenure ? Number(top.data.tenure.replace(/\D/g, '')) : undefined,
      interestRate: top.data.interest_rate,
      bank: top.data.lender,
      amount: top.data.amount ?? top.data.emi,
      dayOfMonth: 5,
      currency: context.currency,
    }
  }

  const goal = findGoal(actions)
  const assets = findAssets(actions)
  const recurring = findRecurringAsset(assets)
  const standaloneRecurring = recurring && !recurring.parent && !goal

  if (standaloneRecurring) {
    const assetData = recurring.data as AssetActionData
    const instrument = assetData.type
    return {
      intent: 'CREATE_RECURRING_INVESTMENT',
      confidence: recurring.confidence,
      parserMethod: result.parserMethod,
      monthlyInvestment: assetData.contribution_amount,
      assetName: assetInstrumentLabel(instrument),
      assetCategory: assetInstrumentToCategory(instrument),
      investmentType: 'SIP',
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      currency: context.currency,
    }
  }

  if (goal && recurring) {
    const goalData = goal.data as GoalActionData
    const assetData = recurring.data as AssetActionData
    const instrument = assetData.type
    return {
      intent: 'CREATE_GOAL_WITH_ASSET',
      confidence: Math.min(goal.confidence, recurring.confidence),
      parserMethod: result.parserMethod,
      goalName: goalData.name,
      amount: goalData.target_amount,
      targetDate: goalData.target_date ?? addMonthsIso(today, 240),
      monthlyInvestment: assetData.contribution_amount,
      assetName: assetInstrumentLabel(instrument),
      assetCategory: assetInstrumentToCategory(instrument),
      investmentType: 'SIP',
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      currency: context.currency,
    }
  }

  if (goal) {
    const goalData = goal.data as GoalActionData
    return {
      intent: 'CREATE_GOAL',
      confidence: goal.confidence,
      parserMethod: result.parserMethod,
      goalName: goalData.name,
      amount: goalData.target_amount,
      targetDate: goalData.target_date ?? addMonthsIso(today, 240),
      currency: context.currency,
    }
  }

  return null
}

export function primaryIntentFromEntities(result: EntityParseResult): CommandIntent | null {
  const structured = entityActionsToStructuredIntent(result, {
    currency: 'INR',
    goals: [],
    assets: [],
    loans: [],
  })
  return structured?.intent ?? null
}
