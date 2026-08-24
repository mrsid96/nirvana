import { addMonthsIso, todayIsoDate } from '@/lib/formatters/dates'
import type { StructuredIntent } from '@/lib/command-bar/types'
import type { Asset, AssetCategory, AssetSource } from '@/types/asset'
import type { ExpenseCategory } from '@/types/expense'
import type { GoalPriority } from '@/types/goal'
import type { RecurringActivity } from '@/types/recurring'
import type { ScheduledOccurrence } from '@/types/recurring'
import type { AssetTransaction } from '@/types/transaction'
import type { Expense } from '@/types/expense'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'

export interface CommandBarFinance {
  assets: Asset[]
  goals: Array<{ id: string; name: string }>
  scheduledOccurrences: ScheduledOccurrence[]
  addGoal: (input: {
    name: string
    description?: string
    targetAmount: number
    startDate: string
    targetDate: string
    priority: GoalPriority
    status: 'active' | 'completed' | 'paused'
  }) => Promise<string>
  addAsset: (input: Omit<Asset, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<string>
  addLoan: (input: Omit<Loan, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<string>
  addExpense: (input: Omit<Expense, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'month'>) => Promise<void>
  addIncome: (input: Omit<Income, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>) => Promise<void>
  addTransaction: (
    input: Omit<AssetTransaction, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>,
    asset: Asset,
  ) => Promise<void>
  addLoanPayment: (
    input: Omit<LoanPayment, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>,
    updateOutstanding?: boolean,
  ) => Promise<void>
  addRecurringActivity: (
    input: Omit<RecurringActivity, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ) => Promise<string>
  skipOccurrence: (occurrence: ScheduledOccurrence, reason?: string) => Promise<void>
}

/**
 * Executes a confirmed structured intent via existing FinanceContext services.
 * This module never touches Firestore directly.
 */
export async function executeConfirmedIntent(
  intent: StructuredIntent,
  finance: CommandBarFinance,
): Promise<void> {
  const today = todayIsoDate()

  switch (intent.intent) {
    case 'ADD_EXPENSE':
      if (!intent.amount) throw new Error('Amount is required')
      await finance.addExpense({
        amount: intent.amount,
        category: (intent.category as ExpenseCategory) ?? 'Other',
        date: intent.date ?? today,
        description: intent.description,
        paymentSource: 'UPI',
      })
      break

    case 'ADD_INCOME':
      if (!intent.amount) throw new Error('Amount is required')
      await finance.addIncome({
        amount: intent.amount,
        source: intent.category ?? intent.source ?? 'Salary',
        date: intent.date ?? today,
        description: intent.description,
      })
      break

    case 'RECORD_INVESTMENT':
    case 'RECORD_WITHDRAWAL': {
      if (!intent.amount) throw new Error('Amount is required')
      const asset = findAsset(intent, finance)
      if (!asset) throw new Error('Choose an asset first')
      await finance.addTransaction(
        {
          assetId: asset.id,
          goalId: asset.goalId,
          type: intent.intent === 'RECORD_INVESTMENT' ? 'INVESTMENT' : 'WITHDRAWAL',
          amount: intent.amount,
          date: intent.date ?? today,
          note: intent.description,
        },
        asset,
      )
      break
    }

    case 'RECORD_LOAN_PAYMENT':
      if (!intent.amount) throw new Error('Amount is required')
      if (!intent.loanId) throw new Error('Choose a loan first')
      await finance.addLoanPayment(
        {
          loanId: intent.loanId,
          amount: intent.amount,
          date: intent.date ?? today,
          note: intent.description,
        },
        true,
      )
      break

    case 'CREATE_RECURRING_INVESTMENT':
      if (!intent.amount) throw new Error('Amount is required')
      await finance.addRecurringActivity({
        type: 'INVESTMENT',
        name: intent.goalName ? `${intent.goalName} SIP` : 'Monthly investment',
        amount: intent.amount,
        frequency: 'MONTHLY',
        scheduledDay: intent.dayOfMonth ?? 1,
        startDate: intent.date ?? today,
        goalId: intent.goalId,
        assetId: intent.assetId,
        status: 'ACTIVE',
        sourceEntityType: 'manual',
      })
      break

    case 'CREATE_RECURRING_EXPENSE':
      if (!intent.amount) throw new Error('Amount is required')
      if (intent.loanId) {
        await finance.addRecurringActivity({
          type: 'LOAN_PAYMENT',
          name: intent.loanName ? `${intent.loanName} EMI` : 'Monthly payment',
          amount: intent.amount,
          frequency: 'MONTHLY',
          scheduledDay: intent.dayOfMonth ?? 1,
          startDate: intent.date ?? today,
          loanId: intent.loanId,
          status: 'ACTIVE',
          sourceEntityType: 'manual',
        })
      } else {
        await finance.addRecurringActivity({
          type: 'EXPENSE',
          name:
            intent.description ??
            (intent.category ? `${intent.category} expense` : 'Monthly expense'),
          amount: intent.amount,
          frequency: 'MONTHLY',
          scheduledDay: intent.dayOfMonth ?? 1,
          startDate: intent.date ?? today,
          expenseCategory: (intent.category as ExpenseCategory) ?? 'Other',
          status: 'ACTIVE',
          sourceEntityType: 'manual',
        })
      }
      break

    case 'CREATE_GOAL':
      if (!intent.amount) throw new Error('Target amount is required')
      const goalName = intent.goalName?.trim() || 'New goal'
      if (!goalName) throw new Error('Goal name is required')
      await finance.addGoal({
        name: goalName,
        description: intent.description,
        targetAmount: intent.amount,
        startDate: today,
        targetDate: intent.targetDate ?? addMonthsIso(today, 240),
        priority: intent.priority ?? 'medium',
        status: 'active',
      })
      break

    case 'CREATE_ASSET':
      if (!intent.amount) throw new Error('Amount is required')
      if (!intent.goalId) throw new Error('Choose a goal first')
      const assetName = intent.assetName?.trim() || 'New asset'
      const category =
        (intent.assetCategory as AssetCategory) ?? inferAssetCategory(assetName)
      const source = mapAssetSource(intent.source)
      const investmentType = intent.investmentType ?? (intent.monthlyInvestment ? 'SIP' : 'LUMP_SUM')
      await finance.addAsset({
        goalId: intent.goalId,
        name: assetName,
        category,
        source,
        investmentType,
        investedAmount: intent.amount,
        currentValue: intent.amount,
        totalWithdrawals: 0,
        expectedCagr: intent.expectedCagr,
        monthlyInvestment:
          investmentType === 'SIP' || investmentType === 'BOTH'
            ? intent.monthlyInvestment ?? intent.amount
            : undefined,
        plannedInvestmentDay:
          investmentType === 'SIP' || investmentType === 'BOTH'
            ? intent.dayOfMonth ?? 1
            : undefined,
        isActive: true,
      })
      break

    case 'CREATE_LOAN':
      const original = intent.originalAmount ?? intent.amount
      if (!original) throw new Error('Loan amount is required')
      const loanName = intent.loanName?.trim() || 'New loan'
      const bank = intent.bank ?? intent.source ?? 'Bank'
      const emi = intent.emiAmount ?? intent.amount ?? original
      await finance.addLoan({
        name: loanName,
        description: intent.description,
        purpose: intent.purpose,
        bank,
        originalAmount: original,
        outstandingAmount: intent.outstandingAmount ?? original,
        interestRate: intent.interestRate ?? 8,
        tenureMonths: intent.tenureMonths ?? 240,
        startDate: intent.startDate ?? intent.date ?? today,
        emiAmount: emi,
        emiDate: intent.dayOfMonth ?? 5,
        deductionBank: bank,
        status: 'ACTIVE',
      })
      break

    case 'SKIP_SCHEDULED_TRANSACTION':
      if (!intent.scheduledOccurrenceId) throw new Error('Choose a scheduled transaction')
      const occurrence = finance.scheduledOccurrences.find(
        (o) => o.id === intent.scheduledOccurrenceId,
      )
      if (!occurrence) throw new Error('Scheduled transaction not found')
      await finance.skipOccurrence(occurrence, intent.description)
      break

    default:
      throw new Error(`Cannot execute intent: ${intent.intent}`)
  }
}

function findAsset(intent: StructuredIntent, finance: CommandBarFinance): Asset | undefined {
  if (intent.assetId) {
    return finance.assets.find((a) => a.id === intent.assetId && !a.isDeleted)
  }
  if (intent.goalId) {
    const goalAssets = finance.assets.filter((a) => a.goalId === intent.goalId && !a.isDeleted)
    return goalAssets[0]
  }
  return finance.assets.find((a) => !a.isDeleted)
}

function mapAssetSource(raw?: string): AssetSource {
  const value = (raw ?? '').toUpperCase()
  if (value === 'ZERODHA' || value === 'GROWW' || value === 'BANK') return value
  if (raw?.toLowerCase().includes('zerodha')) return 'ZERODHA'
  if (raw?.toLowerCase().includes('groww')) return 'GROWW'
  if (raw?.toLowerCase().includes('bank')) return 'BANK'
  return 'OTHER'
}

function inferAssetCategory(name: string): AssetCategory {
  const n = name.toLowerCase()
  if (n.includes('etf')) return 'ETF'
  if (n.includes('fd') || n.includes('deposit')) return 'FD'
  if (n.includes('stock')) return 'STOCK'
  if (n.includes('gold')) return 'GOLD'
  if (n.includes('ppf')) return 'PPF'
  if (n.includes('nps')) return 'NPS'
  return 'MF'
}
