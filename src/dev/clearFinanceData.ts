import { paths } from '@/firebase/paths'
import {
  clean,
  createWriteBatch,
  dbDoc,
  listDocuments,
  touch,
} from '@/firebase/firestore'

const BATCH_LIMIT = 400

export interface ClearFinanceDataResult {
  cleared: number
  byCollection: Record<string, number>
}

async function softDeleteCollection(
  collectionKey: string,
  listPath: string,
  docPath: (id: string) => string,
): Promise<number> {
  const docs = await listDocuments<Record<string, unknown>>(listPath)
  const active = docs.filter((doc) => !doc.isDeleted)
  let cleared = 0

  for (let offset = 0; offset < active.length; offset += BATCH_LIMIT) {
    const chunk = active.slice(offset, offset + BATCH_LIMIT)
    const batch = createWriteBatch()
    for (const doc of chunk) {
      const id = String(doc.id)
      batch.set(
        dbDoc(docPath(id)),
        clean({
          isDeleted: true,
          ...touch(),
          ...(collectionKey === 'goals' ? { status: 'paused' } : {}),
          ...(collectionKey === 'loans' ? { status: 'CLOSED' } : {}),
          ...(collectionKey === 'assets' ? { isActive: false } : {}),
          ...(collectionKey === 'recurringRules' ? { status: 'PAUSED', isActive: false } : {}),
        }),
        { merge: true },
      )
      cleared += 1
    }
    await batch.commit()
  }

  return cleared
}

async function deleteMonthlySummaries(uid: string): Promise<number> {
  const docs = await listDocuments<Record<string, unknown>>(paths.monthlySummaries(uid))
  let cleared = 0

  for (let offset = 0; offset < docs.length; offset += BATCH_LIMIT) {
    const chunk = docs.slice(offset, offset + BATCH_LIMIT)
    const batch = createWriteBatch()
    for (const doc of chunk) {
      const month = String(doc.month ?? doc.id)
      batch.delete(dbDoc(paths.monthlySummary(uid, month)))
      cleared += 1
    }
    await batch.commit()
  }

  return cleared
}

/** Soft-deletes all finance records for a user. Development / account reset utility. */
export async function clearAllFinanceData(uid: string): Promise<ClearFinanceDataResult> {
  const byCollection: Record<string, number> = {}

  byCollection.goals = await softDeleteCollection('goals', paths.goals(uid), (id) =>
    paths.goal(uid, id),
  )
  byCollection.assets = await softDeleteCollection('assets', paths.assets(uid), (id) =>
    paths.asset(uid, id),
  )
  byCollection.transactions = await softDeleteCollection(
    'transactions',
    paths.transactions(uid),
    (id) => paths.transaction(uid, id),
  )
  byCollection.loans = await softDeleteCollection('loans', paths.loans(uid), (id) =>
    paths.loan(uid, id),
  )
  byCollection.loanPayments = await softDeleteCollection(
    'loanPayments',
    paths.loanPayments(uid),
    (id) => paths.loanPayment(uid, id),
  )
  byCollection.expenses = await softDeleteCollection('expenses', paths.expenses(uid), (id) =>
    paths.expense(uid, id),
  )
  byCollection.income = await softDeleteCollection('income', paths.income(uid), (id) =>
    paths.incomeItem(uid, id),
  )
  byCollection.recurringRules = await softDeleteCollection(
    'recurringRules',
    paths.recurringRules(uid),
    (id) => paths.recurringRule(uid, id),
  )
  byCollection.scheduledOccurrences = await softDeleteCollection(
    'scheduledOccurrences',
    paths.scheduledOccurrences(uid),
    (id) => paths.scheduledOccurrence(uid, id),
  )
  byCollection.monthlySummaries = await deleteMonthlySummaries(uid)

  const cleared = Object.values(byCollection).reduce((sum, count) => sum + count, 0)
  return { cleared, byCollection }
}
