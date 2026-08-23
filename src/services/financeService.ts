import { paths } from '@/firebase/paths'
import {
  getDocument,
  listDocuments,
  newId,
  patch,
  stamp,
  toIso,
  touch,
  upsert,
} from '@/firebase/firestore'
import { monthKeyFromDate } from '@/lib/formatters/dates'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import type { AssetTransaction } from '@/types/transaction'

function mapGoal(raw: Record<string, unknown>): Goal {
  return {
    id: String(raw.id),
    name: String(raw.name),
    description: raw.description ? String(raw.description) : undefined,
    targetAmount: Number(raw.targetAmount ?? 0),
    startDate: String(raw.startDate),
    targetDate: String(raw.targetDate),
    priority: (raw.priority as Goal['priority']) ?? 'medium',
    status: (raw.status as Goal['status']) ?? 'active',
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

function mapAsset(raw: Record<string, unknown>, goalId: string): Asset {
  return {
    id: String(raw.id),
    goalId: String(raw.goalId ?? goalId),
    name: String(raw.name),
    category: (raw.category as Asset['category']) ?? 'OTHER',
    source: (raw.source as Asset['source']) ?? 'OTHER',
    investmentType: (raw.investmentType as Asset['investmentType']) ?? 'SIP',
    investedAmount: Number(raw.investedAmount ?? 0),
    currentValue: Number(raw.currentValue ?? 0),
    totalWithdrawals: Number(raw.totalWithdrawals ?? 0),
    expectedCagr: raw.expectedCagr == null ? undefined : Number(raw.expectedCagr),
    monthlyInvestment: raw.monthlyInvestment == null ? undefined : Number(raw.monthlyInvestment),
    plannedInvestmentDay:
      raw.plannedInvestmentDay == null ? undefined : Number(raw.plannedInvestmentDay),
    startDate: raw.startDate ? String(raw.startDate) : undefined,
    endDate: raw.endDate ? String(raw.endDate) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    isActive: raw.isActive !== false,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

function mapTx(raw: Record<string, unknown>): AssetTransaction {
  return {
    id: String(raw.id),
    assetId: String(raw.assetId),
    goalId: String(raw.goalId),
    type: raw.type as AssetTransaction['type'],
    amount: Number(raw.amount ?? 0),
    date: String(raw.date),
    month: String(raw.month ?? monthKeyFromDate(String(raw.date))),
    note: raw.note ? String(raw.note) : undefined,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
  }
}

function mapLoan(raw: Record<string, unknown>): Loan {
  return {
    id: String(raw.id),
    name: String(raw.name),
    description: raw.description ? String(raw.description) : undefined,
    purpose: raw.purpose ? String(raw.purpose) : undefined,
    bank: String(raw.bank ?? ''),
    originalAmount: Number(raw.originalAmount ?? 0),
    outstandingAmount: Number(raw.outstandingAmount ?? 0),
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

function mapPayment(raw: Record<string, unknown>): LoanPayment {
  return {
    id: String(raw.id),
    loanId: String(raw.loanId),
    amount: Number(raw.amount ?? 0),
    principalAmount: raw.principalAmount == null ? undefined : Number(raw.principalAmount),
    interestAmount: raw.interestAmount == null ? undefined : Number(raw.interestAmount),
    date: String(raw.date),
    month: String(raw.month ?? monthKeyFromDate(String(raw.date))),
    note: raw.note ? String(raw.note) : undefined,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
  }
}

function mapExpense(raw: Record<string, unknown>): Expense {
  return {
    id: String(raw.id),
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

function mapIncome(raw: Record<string, unknown>): Income {
  return {
    id: String(raw.id),
    amount: Number(raw.amount ?? 0),
    source: String(raw.source ?? 'Other'),
    description: raw.description ? String(raw.description) : undefined,
    date: String(raw.date),
    month: String(raw.month ?? monthKeyFromDate(String(raw.date))),
    isDeleted: Boolean(raw.isDeleted),
    createdAt: toIso(raw.createdAt),
  }
}

export async function loadFinanceData(uid: string): Promise<{
  goals: Goal[]
  assets: Asset[]
  transactions: AssetTransaction[]
  loans: Loan[]
  loanPayments: LoanPayment[]
  expenses: Expense[]
  income: Income[]
}> {
  const [goalDocs, loanDocs, expenseDocs, incomeDocs] = await Promise.all([
    listDocuments<Record<string, unknown>>(paths.goals(uid)),
    listDocuments<Record<string, unknown>>(paths.loans(uid)),
    listDocuments<Record<string, unknown>>(paths.expenses(uid)),
    listDocuments<Record<string, unknown>>(paths.income(uid)),
  ])

  const goals = goalDocs.map(mapGoal).filter((item) => !item.isDeleted)
  const loans = loanDocs.map(mapLoan).filter((item) => !item.isDeleted)
  const expenses = expenseDocs.map(mapExpense).filter((item) => !item.isDeleted)
  const income = incomeDocs.map(mapIncome).filter((item) => !item.isDeleted)

  const assetGroups = await Promise.all(
    goals.map((goal) => listDocuments<Record<string, unknown>>(paths.assets(uid, goal.id))),
  )
  const assets = assetGroups
    .flatMap((group, index) => group.map((raw) => mapAsset(raw, goals[index]?.id ?? '')))
    .filter((item) => !item.isDeleted)

  const txGroups = await Promise.all(
    assets.map((asset) =>
      listDocuments<Record<string, unknown>>(paths.transactions(uid, asset.goalId, asset.id)),
    ),
  )
  const transactions = txGroups.flatMap((group) => group.map(mapTx)).filter((item) => !item.isDeleted)

  const paymentGroups = await Promise.all(
    loans.map((loan) => listDocuments<Record<string, unknown>>(paths.loanPayments(uid, loan.id))),
  )
  const loanPayments = paymentGroups
    .flatMap((group) => group.map(mapPayment))
    .filter((item) => !item.isDeleted)

  return { goals, assets, transactions, loans, loanPayments, expenses, income }
}

export async function createGoal(
  uid: string,
  input: Omit<Goal, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = newId(paths.goals(uid))
  await upsert(paths.goal(uid, id), { ...input, id, isDeleted: false, ...stamp() })
  return id
}

export async function updateGoal(uid: string, id: string, input: Partial<Goal>): Promise<void> {
  const { id: _id, createdAt: _c, ...rest } = input
  await patch(paths.goal(uid, id), { ...rest, ...touch() })
}

export async function deleteGoal(uid: string, id: string): Promise<void> {
  await patch(paths.goal(uid, id), { isDeleted: true, status: 'paused', ...touch() })
}

export async function createAsset(
  uid: string,
  input: Omit<Asset, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = newId(paths.assets(uid, input.goalId))
  await upsert(paths.asset(uid, input.goalId, id), { ...input, id, isDeleted: false, ...stamp() })
  return id
}

export async function updateAsset(
  uid: string,
  goalId: string,
  id: string,
  input: Partial<Asset>,
): Promise<void> {
  const { id: _id, createdAt: _c, ...rest } = input
  await patch(paths.asset(uid, goalId, id), { ...rest, ...touch() })
}

export async function deleteAsset(uid: string, goalId: string, id: string): Promise<void> {
  await patch(paths.asset(uid, goalId, id), { isDeleted: true, isActive: false, ...touch() })
}

export async function createTransaction(
  uid: string,
  input: Omit<AssetTransaction, 'id' | 'isDeleted' | 'createdAt' | 'month'>,
  asset: Asset,
): Promise<string> {
  const id = newId(paths.transactions(uid, input.goalId, input.assetId))
  const month = monthKeyFromDate(input.date)
  await upsert(paths.transaction(uid, input.goalId, input.assetId, id), {
    ...input,
    id,
    month,
    isDeleted: false,
    ...stamp(),
  })

  const next = { ...asset }
  if (input.type === 'INVESTMENT') {
    next.investedAmount += input.amount
    next.currentValue += input.amount
  } else if (input.type === 'WITHDRAWAL') {
    next.totalWithdrawals += input.amount
    next.currentValue = Math.max(0, next.currentValue - input.amount)
  } else {
    next.currentValue = input.amount
  }
  await patch(paths.asset(uid, asset.goalId, asset.id), {
    investedAmount: next.investedAmount,
    currentValue: next.currentValue,
    totalWithdrawals: next.totalWithdrawals,
    ...touch(),
  })
  return id
}

export async function deleteTransaction(
  uid: string,
  tx: AssetTransaction,
  asset: Asset,
): Promise<void> {
  await patch(paths.transaction(uid, tx.goalId, tx.assetId, tx.id), { isDeleted: true, ...touch() })
  const next = { ...asset }
  if (tx.type === 'INVESTMENT') {
    next.investedAmount = Math.max(0, next.investedAmount - tx.amount)
    next.currentValue = Math.max(0, next.currentValue - tx.amount)
  } else if (tx.type === 'WITHDRAWAL') {
    next.totalWithdrawals = Math.max(0, next.totalWithdrawals - tx.amount)
    next.currentValue += tx.amount
  }
  await patch(paths.asset(uid, asset.goalId, asset.id), {
    investedAmount: next.investedAmount,
    currentValue: next.currentValue,
    totalWithdrawals: next.totalWithdrawals,
    ...touch(),
  })
}

export async function createLoan(
  uid: string,
  input: Omit<Loan, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = newId(paths.loans(uid))
  await upsert(paths.loan(uid, id), { ...input, id, isDeleted: false, ...stamp() })
  return id
}

export async function updateLoan(uid: string, id: string, input: Partial<Loan>): Promise<void> {
  const { id: _id, createdAt: _c, ...rest } = input
  await patch(paths.loan(uid, id), { ...rest, ...touch() })
}

export async function deleteLoan(uid: string, id: string): Promise<void> {
  await patch(paths.loan(uid, id), { isDeleted: true, status: 'CLOSED', ...touch() })
}

export async function createLoanPayment(
  uid: string,
  input: Omit<LoanPayment, 'id' | 'isDeleted' | 'createdAt' | 'month'>,
  updateOutstanding?: boolean,
): Promise<string> {
  const id = newId(paths.loanPayments(uid, input.loanId))
  await upsert(`${paths.loanPayments(uid, input.loanId)}/${id}`, {
    ...input,
    id,
    month: monthKeyFromDate(input.date),
    isDeleted: false,
    ...stamp(),
  })
  if (updateOutstanding) {
    const loan = await getDocument<Record<string, unknown>>(paths.loan(uid, input.loanId))
    if (loan) {
      const principal = input.principalAmount ?? input.amount
      await patch(paths.loan(uid, input.loanId), {
        outstandingAmount: Math.max(0, Number(loan.outstandingAmount ?? 0) - principal),
        ...touch(),
      })
    }
  }
  return id
}

export async function createExpense(
  uid: string,
  input: Omit<Expense, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'month'>,
): Promise<string> {
  const id = newId(paths.expenses(uid))
  await upsert(`${paths.expenses(uid)}/${id}`, {
    ...input,
    id,
    month: monthKeyFromDate(input.date),
    isDeleted: false,
    ...stamp(),
  })
  return id
}

export async function deleteExpense(uid: string, id: string): Promise<void> {
  await patch(`${paths.expenses(uid)}/${id}`, { isDeleted: true, ...touch() })
}

export async function createIncome(
  uid: string,
  input: Omit<Income, 'id' | 'isDeleted' | 'createdAt' | 'month'>,
): Promise<string> {
  const id = newId(paths.income(uid))
  await upsert(`${paths.income(uid)}/${id}`, {
    ...input,
    id,
    month: monthKeyFromDate(input.date),
    isDeleted: false,
    ...stamp(),
  })
  return id
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
  await patch(`${paths.income(uid)}/${id}`, { isDeleted: true, ...touch() })
}

export async function exportUserData(uid: string) {
  const [profile, settings, finance] = await Promise.all([
    getDocument(paths.user(uid)),
    getDocument(paths.settings(uid)),
    loadFinanceData(uid),
  ])
  return {
    exportedAt: new Date().toISOString(),
    profile,
    settings,
    ...finance,
  }
}
