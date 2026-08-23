import { paths } from '@/firebase/paths'
import {
  applyTransactionToAsset,
} from '@/lib/calculations/goals'
import { applyMonthlyDelta } from '@/lib/calculations/derived'
import { mergeRecurringActivities, syncOccurrences } from '@/lib/calculations/recurring'
import { monthKeyFromDate } from '@/lib/formatters/dates'
import {
  byField,
  clean,
  createWriteBatch,
  dbDoc,
  getDocument,
  newId,
  notDeleted,
  nowIso,
  patch,
  queryDocuments,
  runDbTransaction,
  snapshotData,
  stamp,
  touch,
  upsert,
} from '@/firebase/firestore'
import {
  assetWriteFields,
  goalWriteFields,
  mapAsset,
  mapExpense,
  mapIncome,
  mapLoan,
  mapMonthlySummary,
} from '@/services/financeMappers'
import { loadAllFinanceRecords } from '@/services/financeReads'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import { emptyMonthlySummary } from '@/types/monthlySummary'
import type { RecurringActivity, ScheduledOccurrence } from '@/types/recurring'
import type { AssetTransaction } from '@/types/transaction'

function monthlyDeltaForTransaction(
  tx: Pick<AssetTransaction, 'type' | 'amount'>,
  multiplier = 1,
): Partial<{
  investments: number
  withdrawals: number
  transactionCount: number
}> {
  const delta: {
    investments?: number
    withdrawals?: number
    transactionCount: number
  } = { transactionCount: multiplier }
  if (tx.type === 'INVESTMENT') delta.investments = tx.amount * multiplier
  if (tx.type === 'WITHDRAWAL') delta.withdrawals = tx.amount * multiplier
  return delta
}

async function readMonthlySummary(uid: string, month: string) {
  const raw = await getDocument<Record<string, unknown>>(paths.monthlySummary(uid, month))
  return raw ? mapMonthlySummary(raw, month) : emptyMonthlySummary(month)
}

async function writeMonthlyDelta(
  uid: string,
  month: string,
  delta: Partial<{
    income: number
    expenses: number
    investments: number
    withdrawals: number
    loanPayments: number
    transactionCount: number
  }>,
) {
  const current = await readMonthlySummary(uid, month)
  const next = applyMonthlyDelta(current, month, delta)
  await upsert(paths.monthlySummary(uid, month), { ...next, ...touch() })
}

async function loadGoalAssets(uid: string, goalId: string): Promise<Asset[]> {
  const docs = await queryDocuments<Record<string, unknown>>(paths.assets(uid), [
    notDeleted(),
    byField('goalId', goalId),
  ])
  return docs.map((raw) => mapAsset(raw)).filter((item) => !item.isDeleted)
}

async function refreshGoalSummary(uid: string, goalId: string) {
  const assets = await loadGoalAssets(uid, goalId)
  await patch(paths.goal(uid, goalId), { ...goalWriteFields(goalId, assets), ...touch() })
}

export async function createGoal(
  uid: string,
  input: Omit<Goal, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = newId(paths.goals(uid))
  await upsert(paths.goal(uid, id), {
    ...input,
    id,
    userId: uid,
    currentValue: 0,
    investedAmount: 0,
    withdrawnAmount: 0,
    netInvestedAmount: 0,
    monthlyInvestment: 0,
    isDeleted: false,
    ...stamp(),
  })
  return id
}

export async function updateGoal(uid: string, id: string, input: Partial<Goal>): Promise<void> {
  const { id: _id, createdAt: _c, userId: _u, ...rest } = input
  await patch(paths.goal(uid, id), { ...rest, ...touch() })
}

export async function deleteGoal(uid: string, id: string): Promise<void> {
  await patch(paths.goal(uid, id), { isDeleted: true, status: 'paused', ...touch() })
}

export async function createAsset(
  uid: string,
  input: Omit<Asset, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = newId(paths.assets(uid))
  const asset: Asset = {
    ...input,
    id,
    userId: uid,
    isDeleted: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  await upsert(paths.asset(uid, id), {
    ...asset,
    ...assetWriteFields(asset),
    withdrawnAmount: asset.totalWithdrawals,
    plannedDay: asset.plannedInvestmentDay,
    ...stamp(),
  })
  await refreshGoalSummary(uid, input.goalId)
  return id
}

export async function updateAsset(
  uid: string,
  goalId: string,
  id: string,
  input: Partial<Asset>,
): Promise<void> {
  const { id: _id, createdAt: _c, userId: _u, ...rest } = input
  const existing = await getDocument<Record<string, unknown>>(paths.asset(uid, id))
  if (!existing) throw new Error('Asset not found')
  const merged = mapAsset({ ...existing, ...rest, id }, goalId)
  await patch(paths.asset(uid, id), {
    ...rest,
    ...assetWriteFields(merged),
    withdrawnAmount: merged.totalWithdrawals,
    plannedDay: merged.plannedInvestmentDay,
    ...touch(),
  })
  await refreshGoalSummary(uid, goalId)
}

export async function deleteAsset(uid: string, goalId: string, id: string): Promise<void> {
  await patch(paths.asset(uid, id), { isDeleted: true, isActive: false, ...touch() })
  await refreshGoalSummary(uid, goalId)
}

export async function createTransaction(
  uid: string,
  input: Omit<AssetTransaction, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>,
  asset: Asset,
): Promise<string> {
  const id = newId(paths.transactions(uid))
  const month = monthKeyFromDate(input.date)
  const tx: AssetTransaction = {
    ...input,
    id,
    userId: uid,
    month,
    isDeleted: false,
    createdAt: nowIso(),
  }

  const goalAssetDocs = await queryDocuments<Record<string, unknown>>(paths.assets(uid), [
    notDeleted(),
    byField('goalId', input.goalId),
  ])
  const goalAssetIds = goalAssetDocs.map((item) => String(item.id))

  await runDbTransaction(async (transaction) => {
    const assetRef = dbDoc(paths.asset(uid, asset.id))
    const goalRef = dbDoc(paths.goal(uid, input.goalId))
    const txRef = dbDoc(paths.transaction(uid, id))
    const summaryRef = dbDoc(paths.monthlySummary(uid, month))

    const assetSnap = await transaction.get(assetRef)
    const goalSnap = await transaction.get(goalRef)
    const summarySnap = await transaction.get(summaryRef)
    const otherAssetSnaps = await Promise.all(
      goalAssetIds
        .filter((assetId) => assetId !== asset.id)
        .map((assetId) => transaction.get(dbDoc(paths.asset(uid, assetId)))),
    )

    const currentAsset = mapAsset(
      { ...(snapshotData(assetSnap) ?? {}), id: asset.id },
      input.goalId,
    )
    const nextAsset = applyTransactionToAsset(currentAsset, tx)
    const derived = assetWriteFields(nextAsset)

    transaction.set(
      txRef,
      clean({
        ...tx,
        source: asset.source,
        ...stamp(),
      }),
    )
    transaction.set(
      assetRef,
      clean({
        investedAmount: derived.investedAmount,
        withdrawnAmount: derived.withdrawnAmount,
        totalWithdrawals: derived.withdrawnAmount,
        netInvestedAmount: derived.netInvestedAmount,
        currentValue: derived.currentValue,
        gainAmount: derived.gainAmount,
        returnPercentage: derived.returnPercentage,
        ...touch(),
      }),
      { merge: true },
    )

    if (goalSnap.exists()) {
      const goalAssets = [
        nextAsset,
        ...otherAssetSnaps
          .map((snap) => snapshotData<Record<string, unknown>>(snap))
          .filter((raw): raw is Record<string, unknown> => raw !== null)
          .map((raw) => mapAsset(raw)),
      ]
      transaction.set(goalRef, clean({ ...goalWriteFields(input.goalId, goalAssets), ...touch() }), {
        merge: true,
      })
    }

    const summaryRaw = snapshotData<Record<string, unknown>>(summarySnap)
    const currentSummary = summaryRaw
      ? mapMonthlySummary(summaryRaw, month)
      : emptyMonthlySummary(month)
    const nextSummary = applyMonthlyDelta(currentSummary, month, monthlyDeltaForTransaction(tx))
    transaction.set(summaryRef, clean({ ...nextSummary, ...touch() }), { merge: true })
  })

  return id
}

export async function deleteTransaction(
  uid: string,
  tx: AssetTransaction,
  asset: Asset,
): Promise<void> {
  const goalAssetDocs = await queryDocuments<Record<string, unknown>>(paths.assets(uid), [
    notDeleted(),
    byField('goalId', tx.goalId),
  ])
  const goalAssetIds = goalAssetDocs.map((item) => String(item.id))

  await runDbTransaction(async (transaction) => {
    const assetRef = dbDoc(paths.asset(uid, asset.id))
    const goalRef = dbDoc(paths.goal(uid, tx.goalId))
    const txRef = dbDoc(paths.transaction(uid, tx.id))
    const summaryRef = dbDoc(paths.monthlySummary(uid, tx.month))

    const assetSnap = await transaction.get(assetRef)
    const goalSnap = await transaction.get(goalRef)
    const summarySnap = await transaction.get(summaryRef)
    const otherAssetSnaps = await Promise.all(
      goalAssetIds
        .filter((assetId) => assetId !== asset.id)
        .map((assetId) => transaction.get(dbDoc(paths.asset(uid, assetId)))),
    )

    transaction.set(txRef, clean({ isDeleted: true, ...touch() }), { merge: true })

    const currentAsset = mapAsset(
      { ...(snapshotData(assetSnap) ?? {}), id: asset.id },
      tx.goalId,
    )
    let nextAsset = { ...currentAsset }
    if (tx.type === 'INVESTMENT') {
      nextAsset.investedAmount = Math.max(0, nextAsset.investedAmount - tx.amount)
      nextAsset.currentValue = Math.max(0, nextAsset.currentValue - tx.amount)
    } else if (tx.type === 'WITHDRAWAL') {
      nextAsset.totalWithdrawals = Math.max(0, nextAsset.totalWithdrawals - tx.amount)
      nextAsset.currentValue += tx.amount
    } else {
      nextAsset.currentValue = tx.amount
    }
    const derived = assetWriteFields(nextAsset)
    transaction.set(
      assetRef,
      clean({
        investedAmount: derived.investedAmount,
        withdrawnAmount: derived.withdrawnAmount,
        totalWithdrawals: derived.withdrawnAmount,
        netInvestedAmount: derived.netInvestedAmount,
        currentValue: derived.currentValue,
        gainAmount: derived.gainAmount,
        returnPercentage: derived.returnPercentage,
        ...touch(),
      }),
      { merge: true },
    )

    if (goalSnap.exists()) {
      const goalAssets = [
        nextAsset,
        ...otherAssetSnaps
          .map((snap) => snapshotData<Record<string, unknown>>(snap))
          .filter((raw): raw is Record<string, unknown> => raw !== null)
          .map((raw) => mapAsset(raw)),
      ]
      transaction.set(goalRef, clean({ ...goalWriteFields(tx.goalId, goalAssets), ...touch() }), {
        merge: true,
      })
    }

    const summaryRaw = snapshotData<Record<string, unknown>>(summarySnap)
    const currentSummary = summaryRaw
      ? mapMonthlySummary(summaryRaw, tx.month)
      : emptyMonthlySummary(tx.month)
    const nextSummary = applyMonthlyDelta(
      currentSummary,
      tx.month,
      monthlyDeltaForTransaction(tx, -1),
    )
    transaction.set(summaryRef, clean({ ...nextSummary, ...touch() }), { merge: true })
  })
}

export async function createLoan(
  uid: string,
  input: Omit<Loan, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = newId(paths.loans(uid))
  const totalPaid = Math.max(0, input.originalAmount - input.outstandingAmount)
  await upsert(paths.loan(uid, id), {
    ...input,
    id,
    userId: uid,
    totalPaid,
    progressPercentage: input.originalAmount <= 0 ? 0 : (totalPaid / input.originalAmount) * 100,
    isDeleted: false,
    ...stamp(),
  })
  return id
}

export async function updateLoan(uid: string, id: string, input: Partial<Loan>): Promise<void> {
  const { id: _id, createdAt: _c, userId: _u, ...rest } = input
  await patch(paths.loan(uid, id), { ...rest, ...touch() })
}

export async function deleteLoan(uid: string, id: string): Promise<void> {
  await patch(paths.loan(uid, id), { isDeleted: true, status: 'CLOSED', ...touch() })
}

export async function createLoanPayment(
  uid: string,
  input: Omit<LoanPayment, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>,
  updateOutstanding = true,
): Promise<string> {
  const id = newId(paths.loanPayments(uid))
  const month = monthKeyFromDate(input.date)
  const payment: LoanPayment = {
    ...input,
    id,
    userId: uid,
    month,
    isDeleted: false,
    createdAt: nowIso(),
  }

  await runDbTransaction(async (transaction) => {
    const paymentRef = dbDoc(paths.loanPayment(uid, id))
    const loanRef = dbDoc(paths.loan(uid, input.loanId))
    const summaryRef = dbDoc(paths.monthlySummary(uid, month))

    const loanSnap = await transaction.get(loanRef)
    const summarySnap = await transaction.get(summaryRef)

    transaction.set(paymentRef, clean({ ...payment, ...stamp() }))

    if (updateOutstanding && loanSnap.exists()) {
      const loan = mapLoan({ ...(snapshotData(loanSnap) ?? {}), id: input.loanId })
      const principal = input.principalAmount ?? input.amount
      const outstandingAmount = Math.max(0, loan.outstandingAmount - principal)
      const totalPaid = Math.max(0, loan.originalAmount - outstandingAmount)
      transaction.set(
        loanRef,
        clean({
          outstandingAmount,
          totalPaid,
          progressPercentage: loan.originalAmount <= 0 ? 0 : (totalPaid / loan.originalAmount) * 100,
          ...touch(),
        }),
        { merge: true },
      )
    }

    const summaryRaw = snapshotData<Record<string, unknown>>(summarySnap)
    const currentSummary = summaryRaw
      ? mapMonthlySummary(summaryRaw, month)
      : emptyMonthlySummary(month)
    const nextSummary = applyMonthlyDelta(currentSummary, month, {
      loanPayments: payment.amount,
      transactionCount: 1,
    })
    transaction.set(summaryRef, clean({ ...nextSummary, ...touch() }), { merge: true })
  })

  return id
}

export async function createExpense(
  uid: string,
  input: Omit<Expense, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'month'>,
): Promise<string> {
  const id = newId(paths.expenses(uid))
  const month = monthKeyFromDate(input.date)
  await upsert(paths.expense(uid, id), {
    ...input,
    id,
    userId: uid,
    month,
    isDeleted: false,
    ...stamp(),
  })
  if (input.category !== 'EMI') {
    await writeMonthlyDelta(uid, month, { expenses: input.amount, transactionCount: 1 })
  } else {
    await writeMonthlyDelta(uid, month, { loanPayments: input.amount, transactionCount: 1 })
  }
  return id
}

export async function deleteExpense(uid: string, id: string): Promise<void> {
  const raw = await getDocument<Record<string, unknown>>(paths.expense(uid, id))
  if (!raw) return
  const expense = mapExpense(raw)
  await patch(paths.expense(uid, id), { isDeleted: true, ...touch() })
  if (expense.category !== 'EMI') {
    await writeMonthlyDelta(uid, expense.month, { expenses: -expense.amount, transactionCount: -1 })
  } else {
    await writeMonthlyDelta(uid, expense.month, { loanPayments: -expense.amount, transactionCount: -1 })
  }
}

export async function createIncome(
  uid: string,
  input: Omit<Income, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>,
): Promise<string> {
  const id = newId(paths.income(uid))
  const month = monthKeyFromDate(input.date)
  await upsert(paths.incomeItem(uid, id), {
    ...input,
    id,
    userId: uid,
    month,
    isDeleted: false,
    ...stamp(),
  })
  await writeMonthlyDelta(uid, month, { income: input.amount, transactionCount: 1 })
  return id
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
  const raw = await getDocument<Record<string, unknown>>(paths.incomeItem(uid, id))
  if (!raw) return
  const income = mapIncome(raw)
  await patch(paths.incomeItem(uid, id), { isDeleted: true, ...touch() })
  await writeMonthlyDelta(uid, income.month, { income: -income.amount, transactionCount: -1 })
}

export async function createRecurringActivity(
  uid: string,
  input: Omit<RecurringActivity, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = newId(paths.recurringRules(uid))
  await upsert(paths.recurringRule(uid, id), {
    ...input,
    id,
    userId: uid,
    dayOfMonth: input.scheduledDay,
    isActive: input.status === 'ACTIVE',
    sourceEntityType: input.sourceEntityType ?? 'manual',
    isDeleted: false,
    ...stamp(),
  })
  return id
}

export async function updateRecurringActivity(
  uid: string,
  id: string,
  input: Partial<RecurringActivity>,
): Promise<void> {
  const { id: _id, createdAt: _c, userId: _u, ...rest } = input
  const patchData: Record<string, unknown> = { ...rest, ...touch() }
  if (rest.scheduledDay != null) patchData.dayOfMonth = rest.scheduledDay
  if (rest.status != null) patchData.isActive = rest.status === 'ACTIVE'
  await patch(paths.recurringRule(uid, id), patchData)
}

export async function deleteRecurringActivity(uid: string, id: string): Promise<void> {
  await patch(paths.recurringRule(uid, id), { isDeleted: true, status: 'PAUSED', isActive: false, ...touch() })
}

export async function upsertScheduledOccurrence(
  uid: string,
  occurrence: ScheduledOccurrence,
): Promise<void> {
  await upsert(paths.scheduledOccurrence(uid, occurrence.id), {
    ...occurrence,
    userId: uid,
    recurringRuleId: occurrence.recurringActivityId,
    amount: occurrence.expectedAmount,
    ...touch(),
  })
}

export async function syncScheduledOccurrences(
  uid: string,
  data: Pick<
    Awaited<ReturnType<typeof loadAllFinanceRecords>>,
    'goals' | 'assets' | 'loans' | 'recurringActivities' | 'scheduledOccurrences'
  >,
  today: string,
): Promise<ScheduledOccurrence[]> {
  const allActivities = mergeRecurringActivities(
    data.recurringActivities,
    data.assets,
    data.loans,
  )
  const synced = syncOccurrences(allActivities, data.scheduledOccurrences, today)

  const toPersist = synced.filter((occurrence) => {
    const existing = data.scheduledOccurrences.find((item) => item.id === occurrence.id)
    if (!existing) return true
    if (existing.status === 'RECORDED' || existing.status === 'SKIPPED') return false
    return (
      occurrence.status !== existing.status ||
      occurrence.expectedAmount !== existing.expectedAmount ||
      occurrence.name !== existing.name
    )
  })

  if (toPersist.length > 0) {
    const batch = createWriteBatch()
    for (const occurrence of toPersist) {
      batch.set(
        dbDoc(paths.scheduledOccurrence(uid, occurrence.id)),
        clean({
          ...occurrence,
          userId: uid,
          recurringRuleId: occurrence.recurringActivityId,
          amount: occurrence.expectedAmount,
          ...touch(),
        }),
        { merge: true },
      )
    }
    await batch.commit()
  }

  return synced
}

export async function recordScheduledOccurrence(
  uid: string,
  occurrence: ScheduledOccurrence,
  params: { actualAmount: number; actualDate: string; note?: string },
  context: {
    assets: Asset[]
    loans: Loan[]
  },
): Promise<void> {
  let actualTransactionId: string | undefined
  let actualLoanPaymentId: string | undefined
  let actualExpenseId: string | undefined
  let actualIncomeId: string | undefined

  if (occurrence.type === 'INVESTMENT') {
    const asset = context.assets.find((item) => item.id === occurrence.assetId)
    if (!asset || !occurrence.goalId) throw new Error('Linked asset not found')
    actualTransactionId = await createTransaction(
      uid,
      {
        assetId: asset.id,
        goalId: occurrence.goalId,
        type: 'INVESTMENT',
        amount: params.actualAmount,
        date: params.actualDate,
        note: params.note,
      },
      asset,
    )
  } else if (occurrence.type === 'LOAN_PAYMENT') {
    if (!occurrence.loanId) throw new Error('Linked loan not found')
    actualLoanPaymentId = await createLoanPayment(
      uid,
      {
        loanId: occurrence.loanId,
        amount: params.actualAmount,
        date: params.actualDate,
        note: params.note,
      },
      true,
    )
  } else if (occurrence.type === 'INCOME') {
    actualIncomeId = await createIncome(uid, {
      amount: params.actualAmount,
      source: occurrence.incomeSource ?? occurrence.name,
      date: params.actualDate,
      description: params.note,
    })
  } else if (occurrence.type === 'EXPENSE') {
    actualExpenseId = await createExpense(uid, {
      amount: params.actualAmount,
      category: occurrence.expenseCategory ?? 'Other',
      date: params.actualDate,
      description: params.note,
      paymentSource: 'Bank',
    })
  }

  await upsertScheduledOccurrence(uid, {
    ...occurrence,
    status: 'RECORDED',
    actualAmount: params.actualAmount,
    actualDate: params.actualDate,
    actualTransactionId,
    actualLoanPaymentId,
    actualExpenseId,
    actualIncomeId,
    recordedAt: nowIso(),
    syncState: 'SYNCED',
  })
}

export async function skipScheduledOccurrence(
  uid: string,
  occurrence: ScheduledOccurrence,
  reason?: string,
): Promise<void> {
  await upsertScheduledOccurrence(uid, {
    ...occurrence,
    status: 'SKIPPED',
    skipReason: reason,
    recordedAt: nowIso(),
    syncState: 'SYNCED',
  })
}

export async function loadFinanceData(uid: string) {
  return loadAllFinanceRecords(uid)
}

export async function exportUserData(uid: string) {
  const [profile, settings, finance] = await Promise.all([
    getDocument(paths.user(uid)),
    getDocument(paths.settings(uid)),
    loadAllFinanceRecords(uid),
  ])
  return {
    exportedAt: new Date().toISOString(),
    profile,
    settings,
    ...finance,
  }
}

// Re-export mappers for legacy imports
export {
  mapGoal,
  mapAsset,
  mapTx,
  mapLoan,
  mapPayment,
  mapExpense,
  mapIncome,
  mapRecurringActivity,
  mapOccurrence,
} from '@/services/financeMappers'
