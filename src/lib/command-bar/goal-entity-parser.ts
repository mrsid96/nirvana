import { extractAmount } from '@/lib/command-bar/amount'
import { extractMonthlyAmount } from '@/lib/command-bar/bundled-intents'
import {
  assetInstrumentLabel,
  inferAssetInstrument,
} from '@/lib/command-bar/asset-instrument'
import type {
  AssetActionData,
  AssetInstrumentType,
  GoalActionData,
  ParsedFinancialAction,
} from '@/lib/command-bar/entity-model'
import { extractGoalHint } from '@/lib/command-bar/entities'
import { resolveReference, hasPronounReference } from '@/lib/command-bar/reference-resolver'
import { extractTenure } from '@/lib/command-bar/tenure'
import type { ParserContext } from '@/lib/command-bar/types'
import type { SupportedCurrency } from '@/types/user'

const STOP_WORDS = new Set(['the', 'my', 'a', 'an', 'for', 'to', 'of', 'in', 'on', 'at', 'with'])

function capitalizeWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function normalizeGoalName(raw: string, prefix?: 'Buy'): string {
  const name = capitalizeWords(raw.replace(/\s+/g, ' ').trim())
  if (prefix === 'Buy' && !/^buy\b/i.test(name)) {
    return `Buy ${name}`
  }
  return name
}

function extractWorthAmount(text: string, currency: SupportedCurrency): number | undefined {
  const m = text.match(/\bworth\s+([\d,.]+(?:\.\d+)?(?:\s*(?:k|l|lac|lakh|cr|crore))?)/i)
  return m ? extractAmount(m[0], currency) : undefined
}

function refineGoalName(text: string, name: string): string {
  const n = text.toLowerCase()
  if (/\bschool\s+fees\b/.test(n) && /\beducation\b/.test(n)) {
    if (/\bdaughter\b/.test(n)) return "Daughter's Education"
    if (/\bson\b/.test(n)) return "Son's Education"
    if (/\bchild\b/.test(n)) return 'Child Education'
    return 'Education'
  }
  if (/school\s+fees/.test(name.toLowerCase()) && /\beducation\b/.test(n)) {
    if (/\bdaughter\b/.test(n)) return "Daughter's Education"
    if (/\bson\b/.test(n)) return "Son's Education"
    if (/\bchild\b/.test(n)) return 'Child Education'
    return 'Education'
  }
  return name
}

export function refineGoalNameFromText(fullText: string, name: string): string {
  return refineGoalName(fullText, name)
}

function extractClearLoanGoal(text: string, context: ParserContext): ParsedFinancialAction[] {
  const n = text.toLowerCase()
  if (!/\b(clear|cleared|pay off|payoff)\b/.test(n) || !/\bloan\b/.test(n)) {
    return []
  }

  const tenure = extractTenure(text, context.today)
  const loanType = /\bhome\s+loan\b/.test(n) ? 'home_loan' : undefined
  const name = loanType === 'home_loan' ? 'Clear home loan' : 'Clear loan'

  return [
    {
      entity: 'GOAL',
      action: 'CREATE_OR_RESOLVE',
      data: {
        name,
        tenure: tenure?.label,
        target_date: tenure?.targetDate,
        category: loanType,
      },
      confidence: 0.88,
    },
  ]
}

function extractLumpSumHouseAsset(
  text: string,
  currency: SupportedCurrency,
  goalRef: string,
): ParsedFinancialAction | undefined {
  const match = text.match(
    /\bputting\s+([\d,.]+(?:\s*(?:k|l|lac|lakh|lacs|lakhs|cr|crore))?)\s+from\s+(?:my\s+)?savings\s+into\s+(?:the\s+)?(house|home)\b/i,
  )
  if (!match?.[1]) return undefined

  const amount = extractAmount(match[1], currency)
  if (!amount) return undefined

  return {
    entity: 'ASSET',
    action: 'CREATE',
    parent: { entity: 'GOAL', reference: goalRef },
    data: {
      type: 'savings',
      name: assetInstrumentLabel('savings'),
      current_value: amount,
    },
    confidence: 0.88,
  }
}

function inferMultipleAssetTypes(text: string): AssetInstrumentType[] {
  const n = text.toLowerCase()
  const hasMix =
    /\bmix\b/.test(n) ||
    (/\bmutual\s*funds?\b/.test(n) && /\b(?:and|&)\b/.test(n) && /\brd\b/.test(n))

  if (!hasMix) return []

  const types: AssetInstrumentType[] = []
  if (/\bmutual\s*funds?\b/.test(n)) types.push('mutual_fund')
  if (/\brd\b/.test(n)) types.push('rd')
  if (/\bfd\b/.test(n)) types.push('fd')
  if (/\bsip\b/.test(n) && !types.includes('mutual_fund')) types.push('sip')
  return types
}

function parseReferenceAssetUpdate(
  text: string,
  context: ParserContext,
): ParsedFinancialAction[] {
  const n = text.toLowerCase()
  if (!/\b(add|another|increase)\b/.test(n) || !hasPronounReference(text)) {
    return []
  }

  const ref = resolveReference(text, context)
  if (!ref.goalName) return []

  const monthlyAmount = extractMonthlyAmount(text, context.currency)
  if (!monthlyAmount) return []

  const instrument = inferAssetInstrument(text)
  const assetName = ref.assetName ?? assetInstrumentLabel(instrument)

  return [
    {
      entity: 'ASSET',
      action: 'UPDATE',
      parent: { entity: 'GOAL', reference: ref.goalName },
      data: {
        type: instrument,
        name: assetName,
        contribution_amount: monthlyAmount,
        frequency: 'monthly',
      },
      confidence: 0.9,
    },
  ]
}

function extractGoalName(text: string): string | undefined {
  const childEducation = text.match(
    /\bfor\s+(?:(?:my|her|his)\s+)?(?:(?:child|daughter|son)['']?s?\s+)?education\b/i,
  )
  if (childEducation) {
    const n = text.toLowerCase()
    if (/\bdaughter\b/.test(n)) return "Daughter's Education"
    if (/\bson\b/.test(n)) return "Son's Education"
    return 'Child education'
  }

  const patterns: Array<{ re: RegExp; buy?: boolean }> = [
    { re: /\bwant\s+to\s+buy\s+(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)\s+worth\b/i, buy: true },
    { re: /\bwant\s+to\s+buy\s+(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)\s+for\b/i, buy: true },
    { re: /\bwant\s+(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)\s+for\s+[\d₹]/i, buy: true },
    { re: /\bneed\s+[\d₹\w.,]+\s+for\s+(?:my\s+)?(?:child'?s?\s+)?([a-z][\w\s']{1,40}?)(?:\s+after|\s+in|,|\.|$)/i },
    { re: /\bneed\s+[\d₹\w.,]+\s+for\s+(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)(?:\s+in|,|\.|$)/i },
    { re: /\bwant\s+[\d₹\w.,]+\s+for\s+(?:my\s+)?([a-z][\w\s']{1,40}?)(?:\s+in|,|\.|$)/i },
    { re: /\bwant\s+to\s+(?:save|accumulate|build)\s+[\d₹\w.,]+\s+(?:for\s+)?(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)(?:\s+in|,|\.|$)/i },
    { re: /\bwant\s+to\s+save\s+[\d₹\w.,]+\s+for\s+(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)(?:\s+in|,|\.|$)/i },
    { re: /\bbuild\s+(?:a|an|the|my)?\s*([\d₹\w.,]+\s+)?([a-z][\w\s']{1,40}?)(?:\s+fund)?\s+in\b/i },
    { re: /\bwant\s+to\s+renovate\s+(?:my\s+)?([a-z][\w\s']{1,40}?)(?:\s+next|\s+with|,|\.|$)/i },
    { re: /\bneed\s+[\d₹\w.,]+\s+for\s+(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)(?:\s+down\s+payment)?(?:\s+in|,|\.|$)/i },
    { re: /\baccumulate\s+[\d₹\w.,]+\s+(?:corpus\s+)?for\s+([a-z][\w\s']{1,40}?)(?:\s+in|,|\.|$)/i },
    { re: /\bwant\s+([a-z][\w\s']{1,40}?)\s+worth\b/i, buy: true },
    { re: /\bwant\s+(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)\s+worth\b/i, buy: true },
    { re: /\bgift\s+(?:myself|yourself)?\s*(?:a|an|the)?\s*([a-z0-9][\w\s]{0,30}?)(?:\s*,|\s+for\b|\s+and\b)/i },
    { re: /\bbuy\s+(?:a|an|the|my)?\s*([a-z][\w\s']{1,40}?)\s+worth\b/i, buy: true },
  ]

  for (const { re, buy } of patterns) {
    const m = text.match(re)
    const raw = (m?.[2] ?? m?.[1])?.trim()
    if (!raw || raw.length < 2) continue
    const lower = raw.toLowerCase()
    if (STOP_WORDS.has(lower) || /^\d/.test(raw)) continue
    if (lower === 'fund' || lower === 'corpus') continue
    if (lower.includes('mix of') || /^a mix\b/.test(lower)) continue
    return normalizeGoalName(raw, buy ? 'Buy' : undefined)
  }

  return undefined
}

function extractGoalTargetAmount(text: string, currency: SupportedCurrency): number | undefined {
  const worth = extractWorthAmount(text, currency)
  if (worth) return worth

  const forAmount = text.match(
    /\b(?:for|need|want|save|budget of|target)\s+((?:₹|rs\.?|inr)?\s*[\d,.]+(?:\.\d+)?(?:\s*(?:k|l|lac|lakh|lacs|lakhs|cr|crore))?)/i,
  )
  if (forAmount?.[1]) {
    return extractAmount(forAmount[1], currency)
  }

  return extractAmount(text, currency)
}

function extractExistingAssetValue(text: string, currency: SupportedCurrency): number | undefined {
  const patterns = [
    /\balready\s+have\s+([\d₹\w.,]+(?:\s*(?:k|l|lac|lakh|cr|crore))?)/i,
    /\bhave\s+([\d₹\w.,]+(?:\s*(?:k|l|lac|lakh|cr|crore))?)\s+(?:in|saved)/i,
    /\bhave\s+([\d₹\w.,]+(?:\s*(?:k|l|lac|lakh|cr|crore))?)\s+in\b/i,
    /\b([\d₹\w.,]+(?:\s*(?:k|l|lac|lakh|cr|crore))?)\s+saved\s+already/i,
    /\b([\d₹\w.,]+(?:\s*(?:k|l|lac|lakh|cr|crore))?)\s+in\s+(?:an?\s+)?(?:rd|fd|savings?|mutual)/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const val = extractAmount(m[1], currency)
      if (val) return val
    }
  }
  return undefined
}

function isGoalPhrase(text: string): boolean {
  const n = text.toLowerCase()
  if (/\b(clear|cleared|pay off)\b/.test(n) && /\bloan\b/.test(n)) return true
  if (/\bputting\b/.test(n) && /\b(house|home)\b/.test(n)) return true
  return (
    /\b(want|need|save|build|accumulate|renovate|buy|putting)\b/.test(n) &&
    (/\b(for|worth|goal|fund|corpus|in \d+ (?:year|month)|from now|within \d+ year)\b/.test(n) ||
      /\b\d\s*(?:k|l|lac|lakh|cr|crore)\b/.test(n))
  )
}

function isLoanPhrase(text: string): boolean {
  const n = text.toLowerCase()
  if (!/\b(loan|borrow|owe|emi|mortgage|credit card)\b/.test(n)) return false
  if (/\b(clear|cleared|pay off)\b/.test(n)) return false
  if (/\bputting\b/.test(n) && /\b(house|home)\b/.test(n)) return false
  return !isGoalPhrase(text)
}

export function parseGoalEntities(text: string, context: ParserContext): ParsedFinancialAction[] {
  const referenceUpdate = parseReferenceAssetUpdate(text, context)
  if (referenceUpdate.length > 0) return referenceUpdate

  const clearLoanGoal = extractClearLoanGoal(text, context)
  if (clearLoanGoal.length > 0) return clearLoanGoal

  const lumpSum = extractLumpSumHouseAsset(text, context.currency, 'House')
  if (lumpSum) {
    return [
      {
        entity: 'GOAL',
        action: 'CREATE_OR_RESOLVE',
        data: { name: 'House' },
        confidence: 0.88,
      },
      lumpSum,
    ]
  }

  if (isLoanPhrase(text)) return []

  const n = text.toLowerCase()
  const hasMonthly =
    /\b(per month|every month|monthly|each month|a month)\b/.test(n) ||
    /\b\d+k?\s+(?:a|per)\s+month\b/.test(n)
  const hasGoalSignal = isGoalPhrase(text) || /\bgoal\b/.test(n)
  const hasExistingAsset = /\b(already have|have \d|in an? (?:rd|fd|savings|mutual))/i.test(text)
  const hasContribution =
    hasMonthly &&
    /\b(save|saving|invest|put|putting|sip|contribute|afford|rd|mutual|fd)\b/i.test(text)

  if (!hasGoalSignal && !hasExistingAsset && !hasContribution) return []

  const goalName = extractGoalName(text)
  const goalHint = extractGoalHint(text, context.goals)
  const monthlyAmountEarly = hasMonthly ? extractMonthlyAmount(text, context.currency) : undefined

  if (
    !goalName &&
    !goalHint &&
    !/\bworth\b/i.test(text) &&
    monthlyAmountEarly &&
    /\b(invest|sip|save|put)\b/i.test(text)
  ) {
    const instrument = inferAssetInstrument(text)
    return [
      {
        entity: 'ASSET',
        action: 'CREATE',
        data: {
          type: instrument,
          name: assetInstrumentLabel(instrument),
          contribution_amount: monthlyAmountEarly,
          frequency: 'monthly',
        },
        confidence: 0.85,
      },
    ]
  }

  if (!goalName && !goalHint && !hasContribution) return []

  const resolvedName = refineGoalName(
    text,
    goalName ?? (goalHint ? capitalizeWords(goalHint) : undefined) ?? 'New goal',
  )
  const tenure = extractTenure(text, context.today)
  const targetAmount = extractGoalTargetAmount(text, context.currency)
  const monthlyAmount = hasMonthly ? extractMonthlyAmount(text, context.currency) : undefined

  const actions: ParsedFinancialAction[] = []

  const goalData: GoalActionData = {
    name: resolvedName,
    target_amount: targetAmount,
    tenure: tenure?.label,
    target_date: tenure?.targetDate,
  }

  if (targetAmount || tenure || goalName) {
    actions.push({
      entity: 'GOAL',
      action: 'CREATE',
      data: goalData,
      confidence: 0.9,
    })
  }

  const existingValue = extractExistingAssetValue(text, context.currency)
  if (existingValue) {
    const instrument = inferAssetInstrument(text)
    const assetData: AssetActionData = {
      type: instrument,
      name: assetInstrumentLabel(instrument),
      current_value: existingValue,
    }
    actions.push({
      entity: 'ASSET',
      action: 'CREATE',
      parent: { entity: 'GOAL', reference: resolvedName },
      data: assetData,
      confidence: 0.88,
    })
  }

  if (monthlyAmount) {
    const mixedTypes = inferMultipleAssetTypes(text)
    if (mixedTypes.length >= 2) {
      for (const type of mixedTypes) {
        actions.push({
          entity: 'ASSET',
          action: 'CREATE',
          parent: { entity: 'GOAL', reference: resolvedName },
          data: {
            type,
            name: assetInstrumentLabel(type),
            frequency: 'monthly',
          },
          confidence: 0.85,
        })
      }
    } else {
      const instrument = inferAssetInstrument(text)
      const assetData: AssetActionData = {
        type: instrument,
        name: assetInstrumentLabel(instrument),
        contribution_amount: monthlyAmount,
        frequency: 'monthly',
      }
      actions.push({
        entity: 'ASSET',
        action: 'CREATE',
        parent: { entity: 'GOAL', reference: resolvedName },
        data: assetData,
        confidence: 0.9,
      })
    }
  }

  for (const action of actions) {
    if (action.entity === 'GOAL') {
      const goalData = action.data as GoalActionData
      goalData.name = refineGoalName(text, goalData.name)
    }
  }

  return actions
}
