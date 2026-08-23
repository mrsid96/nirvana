import { applyTransactionToAsset } from '@/lib/calculations/goals'
import { applyMonthlyDelta, derivedGoalSummary } from '@/lib/calculations/derived'
import { assetWriteFields, mapAsset } from '@/services/financeMappers'
import { nowIso } from '@/firebase/firestore'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import { emptyMonthlySummary, withFreeCashFlow, type MonthlySummary } from '@/types/monthlySummary'
import type { RecurringActivity, ScheduledOccurrence } from '@/types/recurring'
import type { AssetTransaction } from '@/types/transaction'

export interface FinanceStateSlice {
  goals: Goal[]
  assets: Asset[]
  transactions: AssetTransaction[]
  loans: Loan[]
  loanPayments: LoanPayment[]
  expenses: Expense[]
  income: Income[]
  recurringActivities: RecurringActivity[]
  scheduledOccurrences: ScheduledOccurrence[]
  monthlySummaries: Record<string, MonthlySummary>
  currentMonthlySummary: MonthlySummary | null
}

export function buildGoalFromInput(
  id: string,
  uid: string,
  input: Omit<Goal, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Goal {
  const now = nowIso()
  return {
    ...input,
    id,
    userId: uid,
    currentValue: 0,
    investedAmount: 0,
    withdrawnAmount: 0,
    netInvestedAmount: 0,
    monthlyInvestment: 0,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function buildLoanFromInput(
  id: string,
  uid: string,
  input: Omit<Loan, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Loan {
  const now = nowIso()
  const totalPaid = Math.max(0, input.originalAmount - input.outstandingAmount)
  return {
    ...input,
    id,
    userId: uid,
    totalPaid,
    progressPercentage:
      input.originalAmount <= 0 ? 0 : (totalPaid / input.originalAmount) * 100,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function applyGoalPatch(state: FinanceStateSlice, goal: Goal): FinanceStateSlice {
  const goals = state.goals.some((item) => item.id === goal.id)
    ? state.goals.map((item) => (item.id === goal.id ? goal : item))
    : [...state.goals, goal]
  return { ...state, goals }
}

export function applyLoanPatch(state: FinanceStateSlice, loan: Loan): FinanceStateSlice {
  const loans = state.loans.some((item) => item.id === loan.id)
    ? state.loans.map((item) => (item.id === loan.id ? loan : item))
    : [...state.loans, loan]
  return { ...state, loans }
}

export function applyAssetPatch(state: FinanceStateSlice, asset: Asset, goal?: Goal): FinanceStateSlice {
  const assets = state.assets.some((item) => item.id === asset.id)
    ? state.assets.map((item) => (item.id === asset.id ? asset : item))
    : [...state.assets, asset]
  let next = { ...state, assets }
  if (goal) next = applyGoalPatch(next, goal)
  return next
}

export function applyTransactionPatch(
  state: FinanceStateSlice,
  tx: AssetTransaction,
  asset: Asset,
  goal: Goal,
  monthlySummary: MonthlySummary,
  dashboardMonth: string,
): FinanceStateSlice {
  const transactions = [tx, ...state.transactions.filter((item) => item.id !== tx.id)]
  const monthlySummaries = { ...state.monthlySummaries, [monthlySummary.month]: monthlySummary }
  return {
    ...applyAssetPatch(state, asset, goal),
    transactions,
    monthlySummaries,
    currentMonthlySummary:
      monthlySummary.month === dashboardMonth ? monthlySummary : state.currentMonthlySummary,
  }
}

export function applyLoanPaymentPatch(
  state: FinanceStateSlice,
  payment: LoanPayment,
  loan: Loan,
  monthlySummary: MonthlySummary,
  dashboardMonth: string,
): FinanceStateSlice {
  const loanPayments = [payment, ...state.loanPayments.filter((item) => item.id !== payment.id)]
  const monthlySummaries = { ...state.monthlySummaries, [monthlySummary.month]: monthlySummary }
  return {
    ...applyLoanPatch(state, loan),
    loanPayments,
    monthlySummaries,
    currentMonthlySummary:
      monthlySummary.month === dashboardMonth ? monthlySummary : state.currentMonthlySummary,
  }
}

export function applyExpensePatch(
  state: FinanceStateSlice,
  expense: Expense,
  monthlySummary: MonthlySummary,
  dashboardMonth: string,
): FinanceStateSlice {
  const expenses = [expense, ...state.expenses.filter((item) => item.id !== expense.id)]
  const monthlySummaries = { ...state.monthlySummaries, [monthlySummary.month]: monthlySummary }
  return {
    ...state,
    expenses,
    monthlySummaries,
    currentMonthlySummary:
      monthlySummary.month === dashboardMonth ? monthlySummary : state.currentMonthlySummary,
  }
}

export function applyIncomePatch(
  state: FinanceStateSlice,
  income: Income,
  monthlySummary: MonthlySummary,
  dashboardMonth: string,
): FinanceStateSlice {
  const incomeItems = [income, ...state.income.filter((item) => item.id !== income.id)]
  const monthlySummaries = { ...state.monthlySummaries, [monthlySummary.month]: monthlySummary }
  return {
    ...state,
    income: incomeItems,
    monthlySummaries,
    currentMonthlySummary:
      monthlySummary.month === dashboardMonth ? monthlySummary : state.currentMonthlySummary,
  }
}

export function computeTransactionSideEffects(
  asset: Asset,
  tx: AssetTransaction,
  goal: Goal,
  allAssets: Asset[],
  currentSummary: MonthlySummary | null,
): { asset: Asset; goal: Goal; monthlySummary: MonthlySummary } {
  const nextAssetRaw = applyTransactionToAsset(asset, tx)
  const derived = assetWriteFields(nextAssetRaw)
  const nextAsset = mapAsset(
    {
      ...nextAssetRaw,
      ...derived,
      withdrawnAmount: derived.withdrawnAmount,
      totalWithdrawals: derived.withdrawnAmount,
      updatedAt: nowIso(),
    },
    goal.id,
  )
  const goalAssets = allAssets
    .filter((item) => item.goalId === goal.id && !item.isDeleted && item.id !== asset.id)
    .concat(nextAsset)
  const goalSummary = derivedGoalSummary(goal.id, goalAssets)
  const nextGoal: Goal = { ...goal, ...goalSummary, updatedAt: nowIso() }
  const baseSummary = currentSummary ?? emptyMonthlySummary(tx.month)
  const delta =
    tx.type === 'INVESTMENT'
      ? { investments: tx.amount, transactionCount: 1 }
      : tx.type === 'WITHDRAWAL'
        ? { withdrawals: tx.amount, transactionCount: 1 }
        : { transactionCount: 1 }
  const monthlySummary = withFreeCashFlow(applyMonthlyDelta(baseSummary, tx.month, delta))
  return { asset: nextAsset, goal: nextGoal, monthlySummary }
}

export function patchGoalInList(goals: Goal[], goalId: string, patch: Partial<Goal>, assets: Asset[]): Goal[] {
  const summary = derivedGoalSummary(goalId, assets)
  return goals.map((goal) =>
    goal.id === goalId ? { ...goal, ...patch, ...summary, updatedAt: nowIso() } : goal,
  )
}

export function softDeleteById<T extends { id: string; isDeleted: boolean }>(items: T[], id: string): T[] {
  return items.map((item) =>
    item.id === id ? ({ ...item, isDeleted: true } as T) : item,
  )
}
