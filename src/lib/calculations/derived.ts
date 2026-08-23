import { applyTransactionToAsset, assetGainLoss, assetNetInvested } from '@/lib/calculations/goals'
import { monthKeyFromDate } from '@/lib/formatters/dates'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import {
  emptyMonthlySummary,
  withFreeCashFlow,
  type MonthlySummary,
} from '@/types/monthlySummary'
import type { AssetTransaction } from '@/types/transaction'

export interface DerivedAssetSummary {
  investedAmount: number
  withdrawnAmount: number
  netInvestedAmount: number
  currentValue: number
  gainAmount: number
  returnPercentage: number
}

export interface DerivedGoalSummary {
  currentValue: number
  investedAmount: number
  withdrawnAmount: number
  netInvestedAmount: number
  monthlyInvestment: number
}

export interface DerivedLoanSummary {
  originalAmount: number
  outstandingAmount: number
  totalPaid: number
  progressPercentage: number
  emiAmount: number
}

export interface DerivedDiscrepancy {
  entity: 'asset' | 'goal' | 'loan' | 'monthlySummary'
  id: string
  field: string
  stored: number
  calculated: number
}

export function replayAssetFromLedger(asset: Asset, transactions: AssetTransaction[]): DerivedAssetSummary {
  const txs = transactions
    .filter((tx) => !tx.isDeleted && tx.assetId === asset.id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))

  if (txs.length === 0) {
    return derivedAssetSummary(asset)
  }

  let next: Asset = {
    ...asset,
    investedAmount: 0,
    currentValue: 0,
    totalWithdrawals: 0,
  }
  for (const tx of txs) {
    next = applyTransactionToAsset(next, tx)
  }
  return derivedAssetSummary(next)
}

export function derivedAssetSummary(asset: Asset): DerivedAssetSummary {
  const investedAmount = asset.investedAmount
  const withdrawnAmount = asset.totalWithdrawals
  const netInvestedAmount = assetNetInvested(asset)
  const currentValue = asset.currentValue
  const gainAmount = assetGainLoss(asset)
  const returnPercentage = netInvestedAmount <= 0 ? 0 : (gainAmount / netInvestedAmount) * 100
  return {
    investedAmount,
    withdrawnAmount,
    netInvestedAmount,
    currentValue,
    gainAmount,
    returnPercentage,
  }
}

export function derivedGoalSummary(goalId: string, assets: Asset[]): DerivedGoalSummary {
  const active = assets.filter((asset) => asset.goalId === goalId && !asset.isDeleted)
  const currentValue = active.reduce((sum, asset) => sum + asset.currentValue, 0)
  const investedAmount = active.reduce((sum, asset) => sum + asset.investedAmount, 0)
  const withdrawnAmount = active.reduce((sum, asset) => sum + asset.totalWithdrawals, 0)
  const monthlyInvestment = active
    .filter((asset) => asset.isActive)
    .reduce((sum, asset) => sum + (asset.monthlyInvestment ?? 0), 0)
  return {
    currentValue,
    investedAmount,
    withdrawnAmount,
    netInvestedAmount: investedAmount - withdrawnAmount,
    monthlyInvestment,
  }
}

export function derivedLoanSummary(loan: Loan, payments: LoanPayment[]): DerivedLoanSummary {
  const activePayments = payments.filter((item) => !item.isDeleted && item.loanId === loan.id)
  const principalPaid = activePayments.reduce(
    (sum, item) => sum + (item.principalAmount ?? item.amount),
    0,
  )
  const outstandingAmount =
    activePayments.length > 0 ? Math.max(0, loan.originalAmount - principalPaid) : loan.outstandingAmount
  const totalPaid = Math.max(0, loan.originalAmount - outstandingAmount)
  const progressPercentage = loan.originalAmount <= 0 ? 0 : (totalPaid / loan.originalAmount) * 100
  return {
    originalAmount: loan.originalAmount,
    outstandingAmount,
    totalPaid,
    progressPercentage,
    emiAmount: loan.emiAmount,
  }
}

export function computeMonthlySummaries(params: {
  income: Income[]
  expenses: Expense[]
  transactions: AssetTransaction[]
  loanPayments: LoanPayment[]
}): Record<string, MonthlySummary> {
  const months = new Set<string>()
  for (const item of params.income) if (!item.isDeleted) months.add(item.month || monthKeyFromDate(item.date))
  for (const item of params.expenses) if (!item.isDeleted) months.add(item.month || monthKeyFromDate(item.date))
  for (const item of params.transactions) if (!item.isDeleted) months.add(item.month)
  for (const item of params.loanPayments) if (!item.isDeleted) months.add(item.month)

  const result: Record<string, MonthlySummary> = {}
  for (const month of months) {
    result[month] = computeMonthlySummaryForMonth(month, params)
  }
  return result
}

export function computeMonthlySummaryForMonth(
  month: string,
  params: {
    income: Income[]
    expenses: Expense[]
    transactions: AssetTransaction[]
    loanPayments: LoanPayment[]
  },
): MonthlySummary {
  const income = params.income
    .filter((item) => !item.isDeleted && (item.month || monthKeyFromDate(item.date)) === month)
    .reduce((sum, item) => sum + item.amount, 0)
  const expenses = params.expenses
    .filter(
      (item) =>
        !item.isDeleted &&
        item.category !== 'EMI' &&
        (item.month || monthKeyFromDate(item.date)) === month,
    )
    .reduce((sum, item) => sum + item.amount, 0)
  const investments = params.transactions
    .filter((item) => !item.isDeleted && item.type === 'INVESTMENT' && item.month === month)
    .reduce((sum, item) => sum + item.amount, 0)
  const withdrawals = params.transactions
    .filter((item) => !item.isDeleted && item.type === 'WITHDRAWAL' && item.month === month)
    .reduce((sum, item) => sum + item.amount, 0)
  const fromPayments = params.loanPayments
    .filter((item) => !item.isDeleted && item.month === month)
    .reduce((sum, item) => sum + item.amount, 0)
  const fromEmi = params.expenses
    .filter(
      (item) =>
        !item.isDeleted &&
        item.category === 'EMI' &&
        (item.month || monthKeyFromDate(item.date)) === month,
    )
    .reduce((sum, item) => sum + item.amount, 0)
  const loanPayments = fromPayments > 0 ? fromPayments : fromEmi
  const transactionCount =
    params.income.filter((item) => !item.isDeleted && (item.month || monthKeyFromDate(item.date)) === month)
      .length +
    params.expenses.filter((item) => !item.isDeleted && (item.month || monthKeyFromDate(item.date)) === month)
      .length +
    params.transactions.filter((item) => !item.isDeleted && item.month === month).length +
    params.loanPayments.filter((item) => !item.isDeleted && item.month === month).length

  return withFreeCashFlow({
    month,
    income,
    expenses,
    investments,
    withdrawals,
    loanPayments,
    transactionCount,
  })
}

export function applyMonthlyDelta(
  current: MonthlySummary | null,
  month: string,
  delta: Partial<Pick<MonthlySummary, 'income' | 'expenses' | 'investments' | 'withdrawals' | 'loanPayments' | 'transactionCount'>>,
): MonthlySummary {
  const base = current ?? emptyMonthlySummary(month)
  return withFreeCashFlow({
    month,
    income: base.income + (delta.income ?? 0),
    expenses: base.expenses + (delta.expenses ?? 0),
    investments: base.investments + (delta.investments ?? 0),
    withdrawals: base.withdrawals + (delta.withdrawals ?? 0),
    loanPayments: base.loanPayments + (delta.loanPayments ?? 0),
    transactionCount: Math.max(0, base.transactionCount + (delta.transactionCount ?? 0)),
  })
}

export function compareNumber(stored: number, calculated: number): boolean {
  return stored === calculated
}

export function collectDerivedDiscrepancies(params: {
  assets: Asset[]
  goals: Goal[]
  loans: Loan[]
  transactions: AssetTransaction[]
  loanPayments: LoanPayment[]
  monthlySummaries: MonthlySummary[]
  income: Income[]
  expenses: Expense[]
}): DerivedDiscrepancy[] {
  const discrepancies: DerivedDiscrepancy[] = []

  for (const asset of params.assets.filter((item) => !item.isDeleted)) {
    const calculated = replayAssetFromLedger(asset, params.transactions)
    const stored = derivedAssetSummary(asset)
    pushDiff(discrepancies, 'asset', asset.id, 'investedAmount', stored.investedAmount, calculated.investedAmount)
    pushDiff(discrepancies, 'asset', asset.id, 'withdrawnAmount', stored.withdrawnAmount, calculated.withdrawnAmount)
    pushDiff(discrepancies, 'asset', asset.id, 'currentValue', stored.currentValue, calculated.currentValue)
  }

  for (const goal of params.goals.filter((item) => !item.isDeleted)) {
    const calculated = derivedGoalSummary(goal.id, params.assets)
    if (goal.currentValue != null) {
      pushDiff(discrepancies, 'goal', goal.id, 'currentValue', goal.currentValue, calculated.currentValue)
    }
    if (goal.investedAmount != null) {
      pushDiff(discrepancies, 'goal', goal.id, 'investedAmount', goal.investedAmount, calculated.investedAmount)
    }
  }

  for (const loan of params.loans.filter((item) => !item.isDeleted)) {
    const calculated = derivedLoanSummary(loan, params.loanPayments)
    pushDiff(
      discrepancies,
      'loan',
      loan.id,
      'outstandingAmount',
      loan.outstandingAmount,
      calculated.outstandingAmount,
    )
  }

  const computed = computeMonthlySummaries(params)
  for (const stored of params.monthlySummaries) {
    const calculated = computed[stored.month] ?? emptyMonthlySummary(stored.month)
    pushDiff(discrepancies, 'monthlySummary', stored.month, 'income', stored.income, calculated.income)
    pushDiff(discrepancies, 'monthlySummary', stored.month, 'expenses', stored.expenses, calculated.expenses)
    pushDiff(
      discrepancies,
      'monthlySummary',
      stored.month,
      'investments',
      stored.investments,
      calculated.investments,
    )
    pushDiff(
      discrepancies,
      'monthlySummary',
      stored.month,
      'withdrawals',
      stored.withdrawals,
      calculated.withdrawals,
    )
    pushDiff(
      discrepancies,
      'monthlySummary',
      stored.month,
      'loanPayments',
      stored.loanPayments,
      calculated.loanPayments,
    )
  }

  return discrepancies
}

function pushDiff(
  list: DerivedDiscrepancy[],
  entity: DerivedDiscrepancy['entity'],
  id: string,
  field: string,
  stored: number,
  calculated: number,
) {
  if (stored !== calculated) {
    list.push({ entity, id, field, stored, calculated })
  }
}
