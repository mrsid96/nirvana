import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/types/expense'
import { INCOME_SOURCES } from '@/types/income'

const EXPENSE_KEYWORDS: Record<ExpenseCategory, string[]> = {
  Food: ['food', 'lunch', 'dinner', 'restaurant', 'eating'],
  Groceries: ['groceries', 'grocery', 'supermarket'],
  Transport: ['transport', 'uber', 'taxi', 'fuel', 'petrol', 'commute'],
  Utilities: ['utilities', 'electricity', 'water bill', 'internet', 'wifi'],
  Shopping: ['shopping', 'clothes', 'amazon'],
  Entertainment: ['entertainment', 'movie', 'netflix', 'subscription'],
  Health: ['health', 'medicine', 'doctor', 'hospital', 'pharmacy'],
  Education: ['education', 'course', 'tuition', 'school'],
  Home: ['home', 'rent', 'maintenance', 'furniture'],
  Travel: ['travel', 'flight', 'hotel', 'vacation'],
  EMI: ['emi'],
  Insurance: ['insurance', 'premium'],
  Other: [],
}

const INCOME_KEYWORDS: Record<string, string[]> = {
  Salary: ['salary', 'paycheck', 'pay roll', 'payroll', 'wages'],
  Bonus: ['bonus'],
  Freelance: ['freelance', 'contract'],
  Interest: ['interest', 'dividend'],
  Other: [],
}

const GOAL_KEYWORDS = ['retirement', 'emergency', 'education', 'child', 'house', 'home', 'wedding', 'travel']

const LOAN_KEYWORDS = ['home loan', 'car loan', 'personal loan', 'education loan', 'mortgage', 'emi']

const SOURCE_KEYWORDS: Record<string, string[]> = {
  ZERODHA: ['zerodha'],
  GROWW: ['groww'],
  BANK: ['bank', 'hdfc', 'icici', 'sbi', 'axis'],
  OTHER: [],
}

export function extractExpenseCategory(text: string): ExpenseCategory | undefined {
  const normalized = text.toLowerCase()
  for (const category of EXPENSE_CATEGORIES) {
    const keywords = EXPENSE_KEYWORDS[category]
    for (const kw of keywords) {
      if (normalized.includes(kw)) return category
    }
  }
  return undefined
}

export function extractIncomeCategory(text: string): string | undefined {
  const normalized = text.toLowerCase()
  for (const source of INCOME_SOURCES) {
    const keywords = INCOME_KEYWORDS[source] ?? []
    for (const kw of keywords) {
      if (normalized.includes(kw)) return source
    }
  }
  if (/\bsalary\b/.test(normalized)) return 'Salary'
  return undefined
}

export function extractGoalHint(
  text: string,
  goals?: Array<{ name: string }>,
): string | undefined {
  const normalized = text.toLowerCase()
  if (goals) {
    for (const goal of goals) {
      const name = goal.name.toLowerCase()
      if (name.length >= 3 && normalized.includes(name)) return goal.name
      const words = name.split(/\s+/).filter((word) => word.length >= 4)
      if (words.some((word) => normalized.includes(word))) return goal.name
    }
  }
  for (const kw of GOAL_KEYWORDS) {
    if (normalized.includes(kw)) {
      if (kw === 'home' && /\bhome\s+(loan|interior|renovation|improvement|decor)/i.test(normalized)) {
        continue
      }
      if (kw === 'education' && /\bchild(?:'s)?\s+education\b/i.test(normalized)) {
        return "Child education"
      }
      return kw
    }
  }
  // "in retirement", "for retirement", "towards retirement"
  const inGoal = normalized.match(/(?:in|for|towards|into)\s+(?:my\s+)?([a-z][\w\s]{2,30}?)(?:\s+(?:fund|goal|today|every|through)|[.,]|$)/i)
  if (inGoal?.[1]) {
    const hint = inGoal[1].trim()
    if (!['today', 'month', 'week'].includes(hint)) return hint
  }
  return undefined
}

export function extractLoanHint(text: string): string | undefined {
  const normalized = text.toLowerCase()
  for (const kw of LOAN_KEYWORDS) {
    if (normalized.includes(kw)) return kw
  }
  const towards = normalized.match(/(?:towards?|for)\s+(?:my\s+)?([a-z][\w\s]{2,25}?)(?:\s+(?:loan|emi|today)|[.,]|$)/i)
  if (towards?.[1]) {
    const hint = towards[1].trim()
    if (hint.includes('loan') || normalized.includes(`${hint} loan`)) return hint
  }
  return undefined
}

export function extractAssetHint(text: string): string | undefined {
  const normalized = text.toLowerCase()
  // "HDFC fund", "Nifty ETF", "into my HDFC"
  const fundMatch = normalized.match(
    /(?:into|in|through)\s+(?:my\s+)?([a-z0-9][\w\s]{2,40}?)(?:\s+(?:fund|etf|cap|today|every)|[.,]|$)/i,
  )
  if (fundMatch?.[1]) {
    const hint = fundMatch[1].trim()
    const skip = ['retirement', 'emergency', 'education', 'zerodha', 'groww', 'bank']
    if (!skip.some((s) => hint.includes(s))) return hint
  }
  return undefined
}

export function extractSource(text: string): string | undefined {
  const normalized = text.toLowerCase()
  for (const [source, keywords] of Object.entries(SOURCE_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) return source
    }
  }
  const through = normalized.match(/through\s+(\w+)/i)
  if (through?.[1]) return through[1]
  return undefined
}

export function extractDescription(text: string): string | undefined {
  const onMatch = text.match(/\bon\s+(.+?)(?:\s+today|\s+yesterday|$)/i)
  if (onMatch?.[1]) return onMatch[1].trim()
  return undefined
}
