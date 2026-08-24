import { todayIsoDate } from '@/lib/formatters/dates'
import type { StructuredIntent } from '@/lib/command-bar/types'
import type { Asset } from '@/types/asset'
import type { ExpenseCategory } from '@/types/expense'
import type { RecurringActivity } from '@/types/recurring'
import type { AssetTransaction } from '@/types/transaction'
import type { Expense } from '@/types/expense'
import type { Income } from '@/types/income'
import type { LoanPayment } from '@/types/loan'

export interface CommandBarFinance {
  assets: Asset[]
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
    case 'RECORD_WITHDRAWAL':
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
