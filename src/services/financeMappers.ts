import { monthKeyFromDate } from '@/lib/formatters/dates'
import { derivedAssetSummary, derivedGoalSummary, derivedLoanSummary } from '@/lib/calculations/derived'
import { toIso } from '@/firebase/firestore'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import { emptyMonthlySummary, withFreeCashFlow, type MonthlySummary } from '@/types/monthlySummary'
import type { RecurringActivity, ScheduledOccurrence } from '@/types/recurring'
import type { AssetTransaction } from '@/types/transaction'

export function mapGoal(raw: Record<string, unknown>): Goal {
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    name: String(raw.name),
    description: raw.description ? String(raw.description) : undefined,
    targetAmount: Number(raw.targetAmount ?? 0),
    startDate: String(raw.startDate),
    targetDate: String(raw.targetDate),
    priority: (raw.priority as Goal['priority']) ?? 'medium',
    status: (raw.status as Goal['status']) ?? 'active',
    currentValue: raw.currentValue == null ? undefined : Number(raw.currentValue),
    investedAmount: raw.investedAmount == null ? undefined : Number(raw.investedAmount),
    withdrawnAmount: raw.withdrawnAmount == null ? undefined : Number(raw.withdrawnAmount),
    netInvestedAmount: raw.netInvestedAmount == null ? undefined : Number(raw.netInvestedAmount),
    monthlyInvestment: raw.monthlyInvestment == null ? undefined : Number(raw.monthlyInvestment),
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export function mapAsset(raw: Record<string, unknown>, fallbackGoalId = ''): Asset {
  const investedAmount = Number(raw.investedAmount ?? 0)
  const currentValue = Number(raw.currentValue ?? 0)
  const totalWithdrawals = Number(raw.withdrawnAmount ?? raw.totalWithdrawals ?? 0)
  const asset: Asset = {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    goalId: String(raw.goalId ?? fallbackGoalId),
    name: String(raw.name),
    category: (raw.category as Asset['category']) ?? 'OTHER',
    source: (raw.source as Asset['source']) ?? 'OTHER',
    investmentType: (raw.investmentType as Asset['investmentType']) ?? 'SIP',
    investedAmount,
    currentValue,
    totalWithdrawals,
    expectedCagr: raw.expectedCagr == null ? undefined : Number(raw.expectedCagr),
    monthlyInvestment: raw.monthlyInvestment == null ? undefined : Number(raw.monthlyInvestment),
    plannedInvestmentDay:
      raw.plannedInvestmentDay == null
        ? raw.plannedDay == null
          ? undefined
          : Number(raw.plannedDay)
        : Number(raw.plannedInvestmentDay),
    startDate: raw.startDate ? String(raw.startDate) : undefined,
    endDate: raw.endDate ? String(raw.endDate) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    isActive: raw.isActive !== false,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
  const derived = derivedAssetSummary(asset)
  return {
    ...asset,
    netInvestedAmount: derived.netInvestedAmount,
    gainAmount: derived.gainAmount,
    returnPercentage: derived.returnPercentage,
  }
}

export function mapTx(raw: Record<string, unknown>): AssetTransaction {
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    assetId: String(raw.assetId),
    goalId: String(raw.goalId),
    type: raw.type as AssetTransaction['type'],
    amount: Number(raw.amount ?? 0),
    date: String(raw.date),
    month: String(raw.month ?? monthKeyFromDate(String(raw.date))),
    note: raw.note ? String(raw.note) : undefined,
    source: raw.source ? String(raw.source) : undefined,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: raw.updatedAt ? toIso(raw.updatedAt) : undefined,
  }
}

export function mapLoan(raw: Record<string, unknown>): Loan {
  const originalAmount = Number(raw.originalAmount ?? 0)
  const outstandingAmount = Number(raw.outstandingAmount ?? 0)
  const totalPaid =
    raw.totalPaid == null ? Math.max(0, originalAmount - outstandingAmount) : Number(raw.totalPaid)
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    name: String(raw.name),
    description: raw.description ? String(raw.description) : undefined,
    purpose: raw.purpose ? String(raw.purpose) : undefined,
    bank: String(raw.bank ?? ''),
    originalAmount,
    outstandingAmount,
    totalPaid,
    progressPercentage:
      raw.progressPercentage == null
        ? originalAmount <= 0
          ? 0
          : (totalPaid / originalAmount) * 100
        : Number(raw.progressPercentage),
    interestRate: Number(raw.interestRate ?? 0),
    tenureMonths: Number(raw.tenureMonths ?? 0),
    startDate: String(raw.startDate),
    endDate: raw.endDate ? String(raw.endDate) : undefined,
    emiAmount: Number(raw.emiAmount ?? 0),
    emiDate: Number(raw.emiDate ?? 1),
    deductionBank: String(raw.deductionBank ?? ''),
    status: (raw.status as Loan['status']) ?? 'ACTIVE',
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export function mapPayment(raw: Record<string, unknown>): LoanPayment {
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    loanId: String(raw.loanId),
    amount: Number(raw.amount ?? 0),
    principalAmount: raw.principalAmount == null ? undefined : Number(raw.principalAmount),
    interestAmount: raw.interestAmount == null ? undefined : Number(raw.interestAmount),
    date: String(raw.date),
    month: String(raw.month ?? monthKeyFromDate(String(raw.date))),
    note: raw.note ? String(raw.note) : undefined,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: raw.updatedAt ? toIso(raw.updatedAt) : undefined,
  }
}

export function mapExpense(raw: Record<string, unknown>): Expense {
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    amount: Number(raw.amount ?? 0),
    category: raw.category as Expense['category'],
    description: raw.description ? String(raw.description) : undefined,
    date: String(raw.date),
    month: String(raw.month ?? monthKeyFromDate(String(raw.date))),
    paymentSource: raw.paymentSource as Expense['paymentSource'],
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export function mapIncome(raw: Record<string, unknown>): Income {
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    amount: Number(raw.amount ?? 0),
    source: String(raw.source ?? 'Other'),
    description: raw.description ? String(raw.description) : undefined,
    date: String(raw.date),
    month: String(raw.month ?? monthKeyFromDate(String(raw.date))),
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: raw.updatedAt ? toIso(raw.updatedAt) : undefined,
  }
}

export function mapRecurringActivity(raw: Record<string, unknown>): RecurringActivity {
  const isActive = raw.isActive == null ? raw.status !== 'PAUSED' : Boolean(raw.isActive)
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    type: raw.type as RecurringActivity['type'],
    name: String(raw.name),
    amount: Number(raw.amount ?? 0),
    frequency: (raw.frequency as RecurringActivity['frequency']) ?? 'MONTHLY',
    scheduledDay: Number(raw.dayOfMonth ?? raw.scheduledDay ?? 1),
    startDate: String(raw.startDate),
    endDate: raw.endDate ? String(raw.endDate) : undefined,
    goalId: raw.goalId ? String(raw.goalId) : undefined,
    assetId: raw.assetId ? String(raw.assetId) : undefined,
    loanId: raw.loanId ? String(raw.loanId) : undefined,
    expenseCategory: (raw.expenseCategory ?? raw.category) as RecurringActivity['expenseCategory'],
    incomeSource: raw.incomeSource
      ? String(raw.incomeSource)
      : raw.source && raw.type === 'INCOME'
        ? String(raw.source)
        : undefined,
    status: isActive ? 'ACTIVE' : 'PAUSED',
    sourceEntityId: raw.sourceEntityId ? String(raw.sourceEntityId) : undefined,
    sourceEntityType: raw.sourceEntityType as RecurringActivity['sourceEntityType'],
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export function mapOccurrence(raw: Record<string, unknown>): ScheduledOccurrence {
  const scheduledDate = String(raw.scheduledDate)
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    recurringActivityId: String(raw.recurringRuleId ?? raw.recurringActivityId),
    type: raw.type as ScheduledOccurrence['type'],
    name: String(raw.name ?? ''),
    expectedAmount: Number(raw.amount ?? raw.expectedAmount ?? 0),
    scheduledDate,
    month: String(raw.month ?? scheduledDate.slice(0, 7)),
    status: raw.status as ScheduledOccurrence['status'],
    goalId: raw.goalId ? String(raw.goalId) : undefined,
    assetId: raw.assetId ? String(raw.assetId) : undefined,
    loanId: raw.loanId ? String(raw.loanId) : undefined,
    expenseCategory: raw.expenseCategory as ScheduledOccurrence['expenseCategory'],
    incomeSource: raw.incomeSource ? String(raw.incomeSource) : undefined,
    actualTransactionId: raw.actualTransactionId ? String(raw.actualTransactionId) : undefined,
    actualLoanPaymentId: raw.actualLoanPaymentId ? String(raw.actualLoanPaymentId) : undefined,
    actualExpenseId: raw.actualExpenseId ? String(raw.actualExpenseId) : undefined,
    actualIncomeId: raw.actualIncomeId ? String(raw.actualIncomeId) : undefined,
    actualAmount: raw.actualAmount == null ? undefined : Number(raw.actualAmount),
    actualDate: raw.actualDate ? String(raw.actualDate) : undefined,
    skipReason: raw.skipReason ? String(raw.skipReason) : undefined,
    recordedAt: raw.recordedAt ? String(raw.recordedAt) : undefined,
    syncState: raw.syncState === 'PENDING' || raw.syncState === 'SYNCED' ? raw.syncState : undefined,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export function mapMonthlySummary(raw: Record<string, unknown>, fallbackMonth: string): MonthlySummary {
  return withFreeCashFlow({
    month: String(raw.month ?? raw.id ?? fallbackMonth),
    income: Number(raw.income ?? 0),
    expenses: Number(raw.expenses ?? 0),
    investments: Number(raw.investments ?? 0),
    withdrawals: Number(raw.withdrawals ?? 0),
    loanPayments: Number(raw.loanPayments ?? 0),
    transactionCount: Number(raw.transactionCount ?? 0),
    updatedAt: toIso(raw.updatedAt),
  })
}

export function assetWriteFields(asset: Pick<Asset, 'investedAmount' | 'currentValue' | 'totalWithdrawals' | 'monthlyInvestment' | 'isActive'>) {
  const derived = derivedAssetSummary(asset as Asset)
  return {
    investedAmount: derived.investedAmount,
    withdrawnAmount: derived.withdrawnAmount,
    totalWithdrawals: derived.withdrawnAmount,
    netInvestedAmount: derived.netInvestedAmount,
    currentValue: derived.currentValue,
    gainAmount: derived.gainAmount,
    returnPercentage: derived.returnPercentage,
  }
}

export function goalWriteFields(goalId: string, assets: Asset[]) {
  const summary = derivedGoalSummary(goalId, assets)
  return {
    currentValue: summary.currentValue,
    investedAmount: summary.investedAmount,
    withdrawnAmount: summary.withdrawnAmount,
    netInvestedAmount: summary.netInvestedAmount,
    monthlyInvestment: summary.monthlyInvestment,
  }
}

export function loanWriteFields(loan: Loan, payments: LoanPayment[]) {
  const summary = derivedLoanSummary(loan, payments)
  return {
    outstandingAmount: summary.outstandingAmount,
    totalPaid: summary.totalPaid,
    progressPercentage: summary.progressPercentage,
  }
}

export { emptyMonthlySummary, derivedGoalSummary }
