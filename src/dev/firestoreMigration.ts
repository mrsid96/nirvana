import { paths } from '@/firebase/paths'
import { SCHEMA_VERSION } from '@/firebase/schema'
import {
  clean,
  createWriteBatch,
  dbDoc,
  getDocument,
  listDocuments,
  patch,
  queryDocuments,
  stamp,
  touch,
} from '@/firebase/firestore'
import {
  collectDerivedDiscrepancies,
  computeMonthlySummaries,
  derivedGoalSummary,
  derivedLoanSummary,
  replayAssetFromLedger,
  type DerivedDiscrepancy,
} from '@/lib/calculations/derived'
import { logDevError } from '@/lib/errors'
import {
  assetWriteFields,
  goalWriteFields,
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
import type { Loan, LoanPayment } from '@/types/loan'
import type { AssetTransaction } from '@/types/transaction'

export interface MigrationTotals {
  assetsCurrentValue: number
  assetsInvested: number
  loansOutstanding: number
  transactionCount: number
  paymentCount: number
}

export interface MigrationResult {
  success: boolean
  schemaVersion: number
  totalsBefore: MigrationTotals
  totalsAfter: MigrationTotals
  migrated: {
    assets: number
    transactions: number
    loanPayments: number
    recurringRules: number
    monthlySummaries: number
  }
  discrepancies: DerivedDiscrepancy[]
  error?: string
}

export interface RebuildResult {
  discrepancies: DerivedDiscrepancy[]
  repaired: boolean
  repairedCounts: {
    assets: number
    goals: number
    loans: number
    monthlySummaries: number
  }
}

async function loadLegacyData(uid: string) {
  const goalDocs = await listDocuments<Record<string, unknown>>(paths.goals(uid))
  const goals = goalDocs.map(mapGoal).filter((item) => !item.isDeleted)

  const assetGroups = await Promise.all(
    goals.map((goal) =>
      listDocuments<Record<string, unknown>>(paths.legacy.assets(uid, goal.id)),
    ),
  )
  const assets = assetGroups
    .flatMap((group, index) => group.map((raw) => mapAsset(raw, goals[index]?.id ?? '')))
    .filter((item) => !item.isDeleted)

  const txGroups = await Promise.all(
    assets.map((asset) =>
      listDocuments<Record<string, unknown>>(
        paths.legacy.transactions(uid, asset.goalId, asset.id),
      ),
    ),
  )
  const transactions = txGroups.flatMap((group) => group.map(mapTx)).filter((item) => !item.isDeleted)

  const loanDocs = await listDocuments<Record<string, unknown>>(paths.loans(uid))
  const loans = loanDocs.map(mapLoan).filter((item) => !item.isDeleted)

  const paymentGroups = await Promise.all(
    loans.map((loan) =>
      listDocuments<Record<string, unknown>>(paths.legacy.loanPayments(uid, loan.id)),
    ),
  )
  const loanPayments = paymentGroups
    .flatMap((group) => group.map(mapPayment))
    .filter((item) => !item.isDeleted)

  const expenseDocs = await listDocuments<Record<string, unknown>>(paths.expenses(uid))
  const incomeDocs = await listDocuments<Record<string, unknown>>(paths.income(uid))
  const recurringDocs = await listDocuments<Record<string, unknown>>(paths.legacy.recurringActivities(uid))
  const occurrenceDocs = await listDocuments<Record<string, unknown>>(paths.scheduledOccurrences(uid))

  return {
    goals,
    assets,
    transactions,
    loans,
    loanPayments,
    expenses: expenseDocs.map(mapExpense).filter((item) => !item.isDeleted),
    income: incomeDocs.map(mapIncome).filter((item) => !item.isDeleted),
    recurringActivities: recurringDocs.map(mapRecurringActivity).filter((item) => !item.isDeleted),
    scheduledOccurrences: occurrenceDocs.map(mapOccurrence).filter((item) => !item.isDeleted),
  }
}

function totalsFromLegacy(data: {
  assets: Asset[]
  transactions: AssetTransaction[]
  loans: Loan[]
  loanPayments: LoanPayment[]
}): MigrationTotals {
  return {
    assetsCurrentValue: data.assets.reduce((sum, item) => sum + item.currentValue, 0),
    assetsInvested: data.assets.reduce((sum, item) => sum + item.investedAmount, 0),
    loansOutstanding: data.loans.reduce((sum, item) => sum + item.outstandingAmount, 0),
    transactionCount: data.transactions.length,
    paymentCount: data.loanPayments.length,
  }
}

function totalsFromNormalized(data: {
  assets: Asset[]
  transactions: AssetTransaction[]
  loans: Loan[]
  loanPayments: LoanPayment[]
}): MigrationTotals {
  return totalsFromLegacy(data)
}

export async function migrateFirestoreV1(uid: string): Promise<MigrationResult> {
  const profile = await getDocument<Record<string, unknown>>(paths.user(uid))
  const currentVersion = Number(profile?.schemaVersion ?? 1)
  if (currentVersion >= SCHEMA_VERSION) {
    return {
      success: true,
      schemaVersion: SCHEMA_VERSION,
      totalsBefore: {
        assetsCurrentValue: 0,
        assetsInvested: 0,
        loansOutstanding: 0,
        transactionCount: 0,
        paymentCount: 0,
      },
      totalsAfter: {
        assetsCurrentValue: 0,
        assetsInvested: 0,
        loansOutstanding: 0,
        transactionCount: 0,
        paymentCount: 0,
      },
      migrated: { assets: 0, transactions: 0, loanPayments: 0, recurringRules: 0, monthlySummaries: 0 },
      discrepancies: [],
    }
  }

  const legacy = await loadLegacyData(uid)
  const totalsBefore = totalsFromLegacy(legacy)

  try {
    const batch = createWriteBatch()

    for (const asset of legacy.assets) {
      batch.set(
        dbDoc(paths.asset(uid, asset.id)),
        clean({
          ...asset,
          userId: uid,
          ...assetWriteFields(asset),
          withdrawnAmount: asset.totalWithdrawals,
          plannedDay: asset.plannedInvestmentDay,
          ...stamp(),
        }),
        { merge: true },
      )
    }

    for (const tx of legacy.transactions) {
      const asset = legacy.assets.find((item) => item.id === tx.assetId)
      batch.set(
        dbDoc(paths.transaction(uid, tx.id)),
        clean({
          ...tx,
          userId: uid,
          source: asset?.source,
          ...touch(),
        }),
        { merge: true },
      )
    }

    for (const payment of legacy.loanPayments) {
      batch.set(
        dbDoc(paths.loanPayment(uid, payment.id)),
        clean({ ...payment, userId: uid, ...touch() }),
        { merge: true },
      )
    }

    for (const rule of legacy.recurringActivities) {
      batch.set(
        dbDoc(paths.recurringRule(uid, rule.id)),
        clean({
          ...rule,
          userId: uid,
          dayOfMonth: rule.scheduledDay,
          isActive: rule.status === 'ACTIVE',
          ...touch(),
        }),
        { merge: true },
      )
    }

  for (const goal of legacy.goals) {
      const summary = derivedGoalSummary(goal.id, legacy.assets)
      batch.set(
        dbDoc(paths.goal(uid, goal.id)),
        clean({
          ...goal,
          userId: uid,
          ...summary,
          ...touch(),
        }),
        { merge: true },
      )
    }

    for (const loan of legacy.loans) {
      const summary = derivedLoanSummary(loan, legacy.loanPayments)
      batch.set(
        dbDoc(paths.loan(uid, loan.id)),
        clean({
          ...loan,
          userId: uid,
          outstandingAmount: summary.outstandingAmount,
          totalPaid: summary.totalPaid,
          progressPercentage: summary.progressPercentage,
          ...touch(),
        }),
        { merge: true },
      )
    }

    const monthlySummaries = computeMonthlySummaries({
      income: legacy.income,
      expenses: legacy.expenses,
      transactions: legacy.transactions,
      loanPayments: legacy.loanPayments,
    })
    for (const summary of Object.values(monthlySummaries)) {
      batch.set(dbDoc(paths.monthlySummary(uid, summary.month)), clean({ ...summary, ...touch() }), {
        merge: true,
      })
    }

    await batch.commit()

    const normalized = {
      assets: legacy.assets,
      transactions: legacy.transactions,
      loans: legacy.loans,
      loanPayments: legacy.loanPayments,
    }
    const totalsAfter = totalsFromNormalized(normalized)

    if (
      totalsBefore.assetsCurrentValue !== totalsAfter.assetsCurrentValue ||
      totalsBefore.assetsInvested !== totalsAfter.assetsInvested ||
      totalsBefore.loansOutstanding !== totalsAfter.loansOutstanding ||
      totalsBefore.transactionCount !== totalsAfter.transactionCount ||
      totalsBefore.paymentCount !== totalsAfter.paymentCount
    ) {
      return {
        success: false,
        schemaVersion: currentVersion,
        totalsBefore,
        totalsAfter,
        migrated: {
          assets: legacy.assets.length,
          transactions: legacy.transactions.length,
          loanPayments: legacy.loanPayments.length,
          recurringRules: legacy.recurringActivities.length,
          monthlySummaries: Object.keys(monthlySummaries).length,
        },
        discrepancies: [],
        error: 'Financial totals mismatch after migration',
      }
    }

    await patch(paths.user(uid), { schemaVersion: SCHEMA_VERSION, ...touch() })

    return {
      success: true,
      schemaVersion: SCHEMA_VERSION,
      totalsBefore,
      totalsAfter,
      migrated: {
        assets: legacy.assets.length,
        transactions: legacy.transactions.length,
        loanPayments: legacy.loanPayments.length,
        recurringRules: legacy.recurringActivities.length,
        monthlySummaries: Object.keys(monthlySummaries).length,
      },
      discrepancies: [],
    }
  } catch (error) {
    logDevError(error)
    return {
      success: false,
      schemaVersion: currentVersion,
      totalsBefore,
      totalsAfter: totalsBefore,
      migrated: { assets: 0, transactions: 0, loanPayments: 0, recurringRules: 0, monthlySummaries: 0 },
      discrepancies: [],
      error: error instanceof Error ? error.message : 'Migration failed',
    }
  }
}

export async function rebuildDerivedData(uid: string, repair = false): Promise<RebuildResult> {
  const [goalDocs, assetDocs, loanDocs, txDocs, paymentDocs, expenseDocs, incomeDocs, summaryDocs] =
    await Promise.all([
      listDocuments<Record<string, unknown>>(paths.goals(uid)),
      queryDocuments<Record<string, unknown>>(paths.assets(uid), []),
      listDocuments<Record<string, unknown>>(paths.loans(uid)),
      queryDocuments<Record<string, unknown>>(paths.transactions(uid), []),
      queryDocuments<Record<string, unknown>>(paths.loanPayments(uid), []),
      listDocuments<Record<string, unknown>>(paths.expenses(uid)),
      listDocuments<Record<string, unknown>>(paths.income(uid)),
      listDocuments<Record<string, unknown>>(paths.monthlySummaries(uid)),
    ])

  const goals = goalDocs.map(mapGoal)
  const assets = assetDocs.map((raw) => mapAsset(raw))
  const loans = loanDocs.map(mapLoan)
  const transactions = txDocs.map(mapTx)
  const loanPayments = paymentDocs.map(mapPayment)
  const expenses = expenseDocs.map(mapExpense)
  const income = incomeDocs.map(mapIncome)
  const monthlySummaries = summaryDocs.map((raw) =>
    mapMonthlySummary(raw, String(raw.month ?? raw.id)),
  )

  const discrepancies = collectDerivedDiscrepancies({
    assets,
    goals,
    loans,
    transactions,
    loanPayments,
    monthlySummaries,
    income,
    expenses,
  })

  const repairedCounts = { assets: 0, goals: 0, loans: 0, monthlySummaries: 0 }

  if (repair) {
    const batch = createWriteBatch()

    for (const asset of assets.filter((item) => !item.isDeleted)) {
      const replayed = replayAssetFromLedger(asset, transactions)
      const next = {
        ...asset,
        investedAmount: replayed.investedAmount,
        currentValue: replayed.currentValue,
        totalWithdrawals: replayed.withdrawnAmount,
      }
      batch.set(
        dbDoc(paths.asset(uid, asset.id)),
        clean({
          ...assetWriteFields(next),
          withdrawnAmount: replayed.withdrawnAmount,
          totalWithdrawals: replayed.withdrawnAmount,
          ...touch(),
        }),
        { merge: true },
      )
      repairedCounts.assets += 1
    }

    for (const goal of goals.filter((item) => !item.isDeleted)) {
      batch.set(
        dbDoc(paths.goal(uid, goal.id)),
        clean({ ...goalWriteFields(goal.id, assets), ...touch() }),
        { merge: true },
      )
      repairedCounts.goals += 1
    }

    for (const loan of loans.filter((item) => !item.isDeleted)) {
      const summary = derivedLoanSummary(loan, loanPayments)
      batch.set(
        dbDoc(paths.loan(uid, loan.id)),
        clean({
          outstandingAmount: summary.outstandingAmount,
          totalPaid: summary.totalPaid,
          progressPercentage: summary.progressPercentage,
          ...touch(),
        }),
        { merge: true },
      )
      repairedCounts.loans += 1
    }

    const computed = computeMonthlySummaries({
      income,
      expenses,
      transactions,
      loanPayments,
    })
    for (const summary of Object.values(computed)) {
      batch.set(dbDoc(paths.monthlySummary(uid, summary.month)), clean({ ...summary, ...touch() }), {
        merge: true,
      })
      repairedCounts.monthlySummaries += 1
    }

    await batch.commit()
  }

  return {
    discrepancies,
    repaired: repair,
    repairedCounts,
  }
}
