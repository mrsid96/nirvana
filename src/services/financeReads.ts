import { paths } from '@/firebase/paths'
import {
  ACTIVITY_PAGE_SIZE,
  DASHBOARD_RECENT_TX_LIMIT,
  NOTIFICATION_QUERY_LIMIT,
  SCHEMA_VERSION,
} from '@/firebase/schema'
import { markParallelBatch } from '@/firebase/performance'
import {
  byField,
  getDocument,
  limit,
  listDocuments,
  newestFirst,
  notDeleted,
  queryDocuments,
  queryDocumentsPage,
  where,
} from '@/firebase/firestore'
import { currentMonthKey, shiftMonth } from '@/lib/formatters/dates'
import { isFirestoreIndexError } from '@/lib/errors'
import {
  mapAsset,
  mapExpense,
  mapGoal,
  mapIncome,
  mapLoan,
  mapMonthlySummary,
  mapOccurrence,
  mapPayment,
  mapRecurringActivity,
  mapTx,
} from '@/services/financeMappers'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import type { MonthlySummary } from '@/types/monthlySummary'
import type { RecurringActivity, ScheduledOccurrence } from '@/types/recurring'
import type { AssetTransaction } from '@/types/transaction'
import type { QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore'

async function queryRecentPage<T extends { date: string; isDeleted: boolean }>(
  path: string,
  map: (raw: Record<string, unknown>) => T,
  pageSize: number,
  cursor?: QueryDocumentSnapshot | null,
  extraConstraints: QueryConstraint[] = [],
): Promise<ActivityPage<T>> {
  try {
    const page = await queryDocumentsPage<Record<string, unknown>>(
      path,
      [notDeleted(), ...extraConstraints, newestFirst()],
      pageSize,
      cursor,
    )
    return {
      items: page.items.map(map).filter((item) => !item.isDeleted),
      cursor: page.cursor,
      hasMore: page.hasMore,
    }
  } catch (error) {
    if (!isFirestoreIndexError(error)) throw error
    const docs = await queryDocuments<Record<string, unknown>>(path, [
      notDeleted(),
      ...extraConstraints,
    ])
    const sorted = docs
      .map(map)
      .filter((item) => !item.isDeleted)
      .sort((a, b) => b.date.localeCompare(a.date))
    return {
      items: sorted.slice(0, pageSize),
      cursor: null,
      hasMore: sorted.length > pageSize,
    }
  }
}

async function queryByDate<T extends { date: string; isDeleted: boolean }>(
  path: string,
  map: (raw: Record<string, unknown>) => T,
  constraints: QueryConstraint[],
): Promise<T[]> {
  try {
    const docs = await queryDocuments<Record<string, unknown>>(path, constraints)
    return docs.map(map).filter((item) => !item.isDeleted)
  } catch (error) {
    if (!isFirestoreIndexError(error)) throw error
    const filterOnly = constraints.filter(
      (constraint) => constraint.type === 'where',
    ) as QueryConstraint[]
    const docs = await queryDocuments<Record<string, unknown>>(path, filterOnly)
    return docs
      .map(map)
      .filter((item) => !item.isDeleted)
      .sort((a, b) => b.date.localeCompare(a.date))
  }
}

export interface FinanceCoreData {
  goals: Goal[]
  assets: Asset[]
  loans: Loan[]
  monthlySummaries: Record<string, MonthlySummary>
  currentMonthlySummary: MonthlySummary | null
  scheduledOccurrences: ScheduledOccurrence[]
  recurringActivities: RecurringActivity[]
}

export interface FinanceDetailData {
  transactions: AssetTransaction[]
  loanPayments: LoanPayment[]
  expenses: Expense[]
  income: Income[]
}

export interface ActivityPage<T> {
  items: T[]
  cursor: QueryDocumentSnapshot | null
  hasMore: boolean
}

export async function getUserSchemaVersion(uid: string): Promise<number> {
  const profile = await getDocument<Record<string, unknown>>(paths.user(uid))
  return Number(profile?.schemaVersion ?? 1)
}

export async function loadDerivedSummaries(
  uid: string,
  month = currentMonthKey(),
): Promise<Pick<FinanceCoreData, 'goals' | 'assets' | 'loans' | 'currentMonthlySummary'>> {
  markParallelBatch()
  const [goalDocs, assetDocs, loanDocs, summaryDoc] = await Promise.all([
    queryDocuments<Record<string, unknown>>(paths.goals(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.assets(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.loans(uid), [notDeleted()]),
    getDocument<Record<string, unknown>>(paths.monthlySummary(uid, month)),
  ])

  return {
    goals: goalDocs.map(mapGoal),
    assets: assetDocs.map((raw) => mapAsset(raw)),
    loans: loanDocs.map(mapLoan),
    currentMonthlySummary: summaryDoc ? mapMonthlySummary(summaryDoc, month) : null,
  }
}

export interface DashboardData extends FinanceCoreData {
  recentTransactions: AssetTransaction[]
  recentTransactionCursor: QueryDocumentSnapshot | null
  recentTransactionHasMore: boolean
}

/** Minimal parallel reads for Dashboard bootstrap — no loan payments or recurring rules. */
export async function loadDashboardData(
  uid: string,
  month = currentMonthKey(),
): Promise<DashboardData> {
  markParallelBatch()
  const [goalDocs, assetDocs, loanDocs, occurrenceDocs, summaryDoc, recentActivity] = await Promise.all([
    queryDocuments<Record<string, unknown>>(paths.goals(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.assets(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.loans(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.scheduledOccurrences(uid), [
      where('status', 'in', ['UPCOMING', 'DUE', 'OVERDUE']),
      limit(NOTIFICATION_QUERY_LIMIT),
    ]),
    getDocument<Record<string, unknown>>(paths.monthlySummary(uid, month)),
    queryRecentPage(paths.transactions(uid), mapTx, DASHBOARD_RECENT_TX_LIMIT),
  ])

  const goals = goalDocs.map(mapGoal)
  const assets = assetDocs.map((raw) => mapAsset(raw))
  const loans = loanDocs.map(mapLoan)
  const scheduledOccurrences = occurrenceDocs.map(mapOccurrence)
  const currentMonthlySummary = summaryDoc ? mapMonthlySummary(summaryDoc, month) : null

  return {
    goals,
    assets,
    loans,
    monthlySummaries: currentMonthlySummary ? { [month]: currentMonthlySummary } : {},
    currentMonthlySummary,
    scheduledOccurrences,
    recurringActivities: [],
    recentTransactions: recentActivity.items,
    recentTransactionCursor: recentActivity.cursor,
    recentTransactionHasMore: recentActivity.hasMore,
  }
}

export async function loadRecurringActivities(uid: string): Promise<RecurringActivity[]> {
  const docs = await queryDocuments<Record<string, unknown>>(paths.recurringRules(uid), [notDeleted()])
  return docs.map(mapRecurringActivity)
}

export async function loadCoreFinanceData(uid: string, month = currentMonthKey()): Promise<FinanceCoreData> {
  markParallelBatch()
  const [goalDocs, assetDocs, loanDocs, occurrenceDocs, recurringDocs, summaryDoc] = await Promise.all([
    queryDocuments<Record<string, unknown>>(paths.goals(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.assets(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.loans(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.scheduledOccurrences(uid), [
      where('status', 'in', ['UPCOMING', 'DUE', 'OVERDUE']),
      limit(NOTIFICATION_QUERY_LIMIT),
    ]),
    queryDocuments<Record<string, unknown>>(paths.recurringRules(uid), [notDeleted()]),
    getDocument<Record<string, unknown>>(paths.monthlySummary(uid, month)),
  ])

  const goals = goalDocs.map(mapGoal)
  const assets = assetDocs.map((raw) => mapAsset(raw))
  const loans = loanDocs.map(mapLoan)
  const scheduledOccurrences = occurrenceDocs.map(mapOccurrence)
  const recurringActivities = recurringDocs.map(mapRecurringActivity)
  const currentMonthlySummary = summaryDoc
    ? mapMonthlySummary(summaryDoc, month)
    : null

  return {
    goals,
    assets,
    loans,
    monthlySummaries: currentMonthlySummary ? { [month]: currentMonthlySummary } : {},
    currentMonthlySummary,
    scheduledOccurrences,
    recurringActivities,
  }
}

export async function loadMonthlySummary(uid: string, month: string): Promise<MonthlySummary | null> {
  const raw = await getDocument<Record<string, unknown>>(paths.monthlySummary(uid, month))
  return raw ? mapMonthlySummary(raw, month) : null
}

export async function loadStatementMonthData(uid: string, month: string): Promise<{
  summary: MonthlySummary | null
  expenses: Expense[]
  income: Income[]
  transactions: AssetTransaction[]
  loanPayments: LoanPayment[]
}> {
  markParallelBatch()
  const [summaryDoc, expenses, income, transactions, loanPayments] = await Promise.all([
    getDocument<Record<string, unknown>>(paths.monthlySummary(uid, month)),
    queryByDate(paths.expenses(uid), mapExpense, [
      notDeleted(),
      byField('month', month),
      newestFirst(),
    ]),
    queryByDate(paths.income(uid), mapIncome, [
      notDeleted(),
      byField('month', month),
      newestFirst(),
    ]),
    queryByDate(paths.transactions(uid), mapTx, [
      notDeleted(),
      byField('month', month),
      newestFirst(),
    ]),
    queryByDate(paths.loanPayments(uid), mapPayment, [
      notDeleted(),
      byField('month', month),
      newestFirst(),
    ]),
  ])

  return {
    summary: summaryDoc ? mapMonthlySummary(summaryDoc, month) : null,
    expenses,
    income,
    transactions,
    loanPayments,
  }
}

export async function loadGoalDetailData(
  uid: string,
  goalId: string,
): Promise<{ assets: Asset[]; transactions: AssetTransaction[] }> {
  const [assetDocs, transactions] = await Promise.all([
    queryDocuments<Record<string, unknown>>(paths.assets(uid), [notDeleted(), byField('goalId', goalId)]),
    queryByDate(paths.transactions(uid), mapTx, [
      notDeleted(),
      byField('goalId', goalId),
      newestFirst(),
    ]),
  ])
  return {
    assets: assetDocs.map((raw) => mapAsset(raw)).filter((item) => !item.isDeleted),
    transactions,
  }
}

export async function loadLoanDetailPayments(uid: string, loanId: string): Promise<LoanPayment[]> {
  return queryByDate(paths.loanPayments(uid), mapPayment, [
    notDeleted(),
    byField('loanId', loanId),
    newestFirst(),
  ])
}

export async function loadRecentTransactions(
  uid: string,
  pageSize = ACTIVITY_PAGE_SIZE,
  cursor?: QueryDocumentSnapshot | null,
): Promise<ActivityPage<AssetTransaction>> {
  return queryRecentPage(paths.transactions(uid), mapTx, pageSize, cursor)
}

export async function loadRecentLoanPayments(
  uid: string,
  pageSize = ACTIVITY_PAGE_SIZE,
  cursor?: QueryDocumentSnapshot | null,
): Promise<ActivityPage<LoanPayment>> {
  return queryRecentPage(paths.loanPayments(uid), mapPayment, pageSize, cursor)
}

export async function loadTransactionsSince(uid: string, startDate: string): Promise<AssetTransaction[]> {
  return queryByDate(paths.transactions(uid), mapTx, [notDeleted(), where('date', '>=', startDate)])
}

export async function loadWealthHistoryTransactions(uid: string, monthsBack = 13): Promise<AssetTransaction[]> {
  const start = shiftMonth(currentMonthKey(), -monthsBack)
  const startDate = `${start}-01`
  return loadTransactionsSince(uid, startDate)
}

/** Full dataset — development export and reconciliation only. */
export async function loadAllFinanceRecords(uid: string): Promise<FinanceCoreData & FinanceDetailData> {
  const core = await loadCoreFinanceData(uid)
  const [txDocs, paymentDocs, expenseDocs, incomeDocs, summaryDocs] = await Promise.all([
    queryDocuments<Record<string, unknown>>(paths.transactions(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.loanPayments(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.expenses(uid), [notDeleted()]),
    queryDocuments<Record<string, unknown>>(paths.income(uid), [notDeleted()]),
    listDocuments<Record<string, unknown>>(paths.monthlySummaries(uid)),
  ])

  const monthlySummaries: Record<string, MonthlySummary> = { ...core.monthlySummaries }
  for (const raw of summaryDocs) {
    const month = String(raw.month ?? raw.id)
    monthlySummaries[month] = mapMonthlySummary(raw, month)
  }

  return {
    ...core,
    monthlySummaries,
    transactions: txDocs.map(mapTx),
    loanPayments: paymentDocs.map(mapPayment),
    expenses: expenseDocs.map(mapExpense),
    income: incomeDocs.map(mapIncome),
  }
}

export { SCHEMA_VERSION }
