import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { migrateFirestoreV1 } from '@/dev/firestoreMigration'
import { mergeRecurringActivities, syncOccurrences } from '@/lib/calculations/recurring'
import { currentMonthKey, todayIsoDate } from '@/lib/formatters/dates'
import { logDevError, toUserMessage } from '@/lib/errors'
import {
  createAsset,
  createExpense,
  createGoal,
  createIncome,
  createLoan,
  createLoanPayment,
  createRecurringActivity,
  createTransaction,
  deleteAsset,
  deleteExpense,
  deleteGoal,
  deleteIncome,
  deleteLoan,
  deleteRecurringActivity,
  deleteTransaction,
  exportUserData,
  recordScheduledOccurrence,
  skipScheduledOccurrence,
  syncScheduledOccurrences,
  updateAsset,
  updateGoal,
  updateLoan,
  updateRecurringActivity,
} from '@/services/financeService'
import {
  loadCoreFinanceData,
  loadDerivedSummaries,
  loadGoalDetailData,
  loadLoanDetailPayments,
  loadRecentLoanPayments,
  loadRecentTransactions,
  loadStatementMonthData,
  loadWealthHistoryTransactions,
} from '@/services/financeReads'
import { nowIso } from '@/firebase/firestore'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import type { MonthlySummary } from '@/types/monthlySummary'
import type { RecurringActivity, ScheduledOccurrence } from '@/types/recurring'
import type { AssetTransaction } from '@/types/transaction'
import type { QueryDocumentSnapshot } from 'firebase/firestore'

interface FinanceState {
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

interface FinanceContextValue extends FinanceState {
  loading: boolean
  error: string | null
  allRecurringActivities: RecurringActivity[]
  wealthActivityCursor: QueryDocumentSnapshot | null
  wealthActivityHasMore: boolean
  loanActivityCursor: QueryDocumentSnapshot | null
  loanActivityHasMore: boolean
  refresh: (options?: { silent?: boolean }) => Promise<void>
  ensureWealthHistory: () => Promise<void>
  ensureGoalDetail: (goalId: string) => Promise<void>
  ensureLoanDetail: (loanId: string) => Promise<void>
  ensureStatementMonth: (month: string) => Promise<void>
  loadMoreWealthActivity: () => Promise<void>
  loadMoreLoanActivity: () => Promise<void>
  addGoal: (input: Omit<Goal, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<string>
  editGoal: (id: string, input: Partial<Goal>) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  addAsset: (input: Omit<Asset, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<string>
  editAsset: (goalId: string, id: string, input: Partial<Asset>) => Promise<void>
  removeAsset: (goalId: string, id: string) => Promise<void>
  addTransaction: (
    input: Omit<AssetTransaction, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>,
    asset: Asset,
  ) => Promise<void>
  removeTransaction: (tx: AssetTransaction, asset: Asset) => Promise<void>
  addLoan: (input: Omit<Loan, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<string>
  editLoan: (id: string, input: Partial<Loan>) => Promise<void>
  removeLoan: (id: string) => Promise<void>
  addLoanPayment: (
    input: Omit<LoanPayment, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>,
    updateOutstanding?: boolean,
  ) => Promise<void>
  addExpense: (
    input: Omit<Expense, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'month'>,
  ) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  addIncome: (input: Omit<Income, 'id' | 'isDeleted' | 'createdAt' | 'month' | 'updatedAt'>) => Promise<void>
  removeIncome: (id: string) => Promise<void>
  addRecurringActivity: (
    input: Omit<RecurringActivity, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ) => Promise<string>
  editRecurringActivity: (id: string, input: Partial<RecurringActivity>) => Promise<void>
  removeRecurringActivity: (id: string) => Promise<void>
  recordOccurrence: (
    occurrence: ScheduledOccurrence,
    params: { actualAmount: number; actualDate: string; note?: string },
  ) => Promise<void>
  skipOccurrence: (occurrence: ScheduledOccurrence, reason?: string) => Promise<void>
  exportJson: () => Promise<unknown>
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

const empty: FinanceState = {
  goals: [],
  assets: [],
  transactions: [],
  loans: [],
  loanPayments: [],
  expenses: [],
  income: [],
  recurringActivities: [],
  scheduledOccurrences: [],
  monthlySummaries: {},
  currentMonthlySummary: null,
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) map.set(item.id, item)
  return [...map.values()]
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user, settings } = useAuth()
  const [state, setState] = useState<FinanceState>(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wealthActivityCursor, setWealthActivityCursor] = useState<QueryDocumentSnapshot | null>(null)
  const [wealthActivityHasMore, setWealthActivityHasMore] = useState(false)
  const [loanActivityCursor, setLoanActivityCursor] = useState<QueryDocumentSnapshot | null>(null)
  const [loanActivityHasMore, setLoanActivityHasMore] = useState(false)
  const loadedGoalDetailsRef = useRef<Set<string>>(new Set())
  const loadedLoanDetailsRef = useRef<Set<string>>(new Set())
  const loadedStatementMonthsRef = useRef<Set<string>>(new Set())
  const loadedWealthHistoryRef = useRef(false)
  const detailLoadsRef = useRef<Map<string, Promise<void>>>(new Map())

  const dashboardMonth = settings?.dashboardMonth ?? currentMonthKey()

  const runDetailLoad = useCallback(async (key: string, load: () => Promise<void>) => {
    if (detailLoadsRef.current.has(key)) {
      return detailLoadsRef.current.get(key)
    }
    const promise = load().finally(() => {
      detailLoadsRef.current.delete(key)
    })
    detailLoadsRef.current.set(key, promise)
    return promise
  }, [])

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) {
      setState(empty)
      return
    }
    if (!options?.silent) setLoading(true)
    setError(null)
    loadedGoalDetailsRef.current.clear()
    loadedLoanDetailsRef.current.clear()
    loadedStatementMonthsRef.current.clear()
    loadedWealthHistoryRef.current = false
    try {
      const migration = await migrateFirestoreV1(user.uid)
      if (!migration.success && import.meta.env.DEV) {
        console.warn('[nirvana] Firestore migration issue:', migration.error)
      }

      const core = await loadCoreFinanceData(user.uid, dashboardMonth)
      const [recentActivity, recentPayments] = await Promise.all([
        loadRecentTransactions(user.uid),
        loadRecentLoanPayments(user.uid),
      ])

      const today = todayIsoDate()
      const allActivities = mergeRecurringActivities(
        core.recurringActivities,
        core.assets,
        core.loans,
      )
      const occurrences = syncOccurrences(
        allActivities,
        core.scheduledOccurrences,
        today,
      )
      void syncScheduledOccurrences(user.uid, {
        goals: core.goals,
        assets: core.assets,
        loans: core.loans,
        recurringActivities: core.recurringActivities,
        scheduledOccurrences: core.scheduledOccurrences,
      }, today).catch(logDevError)

      setWealthActivityCursor(recentActivity.cursor)
      setWealthActivityHasMore(recentActivity.hasMore)
      setLoanActivityCursor(recentPayments.cursor)
      setLoanActivityHasMore(recentPayments.hasMore)

      setState({
        goals: core.goals,
        assets: core.assets,
        loans: core.loans,
        transactions: recentActivity.items,
        loanPayments: recentPayments.items,
        expenses: [],
        income: [],
        recurringActivities: core.recurringActivities,
        scheduledOccurrences: occurrences,
        monthlySummaries: core.monthlySummaries,
        currentMonthlySummary: core.currentMonthlySummary,
      })
    } catch (err) {
      logDevError(err)
      setError(toUserMessage(err))
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }, [user, dashboardMonth])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user) {
        void refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh, user])

  const ensureWealthHistory = useCallback(async () => {
    if (!user || loadedWealthHistoryRef.current) return
    loadedWealthHistoryRef.current = true
    const historyTransactions = await loadWealthHistoryTransactions(user.uid, 13)
    setState((prev) => ({
      ...prev,
      transactions: mergeById(prev.transactions, historyTransactions),
    }))
  }, [user])

  const refreshSummaries = useCallback(async () => {
    if (!user) return
    const summaries = await loadDerivedSummaries(user.uid, dashboardMonth)
    setState((prev) => ({
      ...prev,
      goals: summaries.goals,
      assets: summaries.assets,
      loans: summaries.loans,
      monthlySummaries: summaries.currentMonthlySummary
        ? { ...prev.monthlySummaries, [dashboardMonth]: summaries.currentMonthlySummary }
        : prev.monthlySummaries,
      currentMonthlySummary: summaries.currentMonthlySummary ?? prev.currentMonthlySummary,
    }))
  }, [user, dashboardMonth])

  const refreshActivity = useCallback(async () => {
    if (!user) return
    const [recentActivity, recentPayments] = await Promise.all([
      loadRecentTransactions(user.uid),
      loadRecentLoanPayments(user.uid),
    ])
    setState((prev) => ({
      ...prev,
      transactions: mergeById(prev.transactions, recentActivity.items),
      loanPayments: mergeById(prev.loanPayments, recentPayments.items),
    }))
  }, [user])

  const ensureGoalDetail = useCallback(
    async (goalId: string) => {
      if (!user || loadedGoalDetailsRef.current.has(goalId)) return
      await runDetailLoad(`goal:${goalId}`, async () => {
        const detail = await loadGoalDetailData(user.uid, goalId)
        setState((prev) => ({
          ...prev,
          assets: mergeById(prev.assets, detail.assets),
          transactions: mergeById(prev.transactions, detail.transactions),
        }))
        loadedGoalDetailsRef.current.add(goalId)
      })
    },
    [user, runDetailLoad],
  )

  const ensureLoanDetail = useCallback(
    async (loanId: string) => {
      if (!user || loadedLoanDetailsRef.current.has(loanId)) return
      await runDetailLoad(`loan:${loanId}`, async () => {
        const payments = await loadLoanDetailPayments(user.uid, loanId)
        setState((prev) => ({
          ...prev,
          loanPayments: mergeById(prev.loanPayments, payments),
        }))
        loadedLoanDetailsRef.current.add(loanId)
      })
    },
    [user, runDetailLoad],
  )

  const ensureStatementMonth = useCallback(
    async (month: string) => {
      if (!user || loadedStatementMonthsRef.current.has(month)) return
      await runDetailLoad(`statement:${month}`, async () => {
        const data = await loadStatementMonthData(user.uid, month)
        setState((prev) => ({
          ...prev,
          expenses: mergeById(prev.expenses, data.expenses),
          income: mergeById(prev.income, data.income),
          transactions: mergeById(prev.transactions, data.transactions),
          loanPayments: mergeById(prev.loanPayments, data.loanPayments),
          monthlySummaries: {
            ...prev.monthlySummaries,
            ...(data.summary ? { [month]: data.summary } : {}),
          },
          currentMonthlySummary:
            month === dashboardMonth ? data.summary ?? prev.currentMonthlySummary : prev.currentMonthlySummary,
        }))
        loadedStatementMonthsRef.current.add(month)
      })
    },
    [user, dashboardMonth, runDetailLoad],
  )

  const loadMoreWealthActivity = useCallback(async () => {
    if (!user || !wealthActivityHasMore) return
    const page = await loadRecentTransactions(user.uid, undefined, wealthActivityCursor)
    setWealthActivityCursor(page.cursor)
    setWealthActivityHasMore(page.hasMore)
    setState((prev) => ({
      ...prev,
      transactions: mergeById(prev.transactions, page.items),
    }))
  }, [user, wealthActivityCursor, wealthActivityHasMore])

  const loadMoreLoanActivity = useCallback(async () => {
    if (!user || !loanActivityHasMore) return
    const page = await loadRecentLoanPayments(user.uid, undefined, loanActivityCursor)
    setLoanActivityCursor(page.cursor)
    setLoanActivityHasMore(page.hasMore)
    setState((prev) => ({
      ...prev,
      loanPayments: mergeById(prev.loanPayments, page.items),
    }))
  }, [user, loanActivityCursor, loanActivityHasMore])

  const run = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action()
        await refresh({ silent: true })
      } catch (err) {
        logDevError(err)
        throw new Error(toUserMessage(err))
      }
    },
    [refresh],
  )

  const allRecurringActivities = useMemo(
    () => mergeRecurringActivities(state.recurringActivities, state.assets, state.loans),
    [state.recurringActivities, state.assets, state.loans],
  )

  const value = useMemo<FinanceContextValue>(
    () => ({
      ...state,
      loading,
      error,
      allRecurringActivities,
      wealthActivityCursor,
      wealthActivityHasMore,
      loanActivityCursor,
      loanActivityHasMore,
      refresh,
      ensureWealthHistory,
      ensureGoalDetail,
      ensureLoanDetail,
      ensureStatementMonth,
      loadMoreWealthActivity,
      loadMoreLoanActivity,
      addGoal: async (input) => {
        if (!user) throw new Error('Not signed in')
        const id = await createGoal(user.uid, input)
        await refresh({ silent: true })
        return id
      },
      editGoal: (id, input) => run(async () => updateGoal(user!.uid, id, input)),
      removeGoal: (id) => run(async () => deleteGoal(user!.uid, id)),
      addAsset: async (input) => {
        if (!user) throw new Error('Not signed in')
        const id = await createAsset(user.uid, input)
        await refresh({ silent: true })
        return id
      },
      editAsset: (goalId, id, input) => run(async () => updateAsset(user!.uid, goalId, id, input)),
      removeAsset: (goalId, id) => run(async () => deleteAsset(user!.uid, goalId, id)),
      addTransaction: (input, asset) =>
        run(async () => {
          await createTransaction(user!.uid, input, asset)
        }),
      removeTransaction: (tx, asset) => run(async () => deleteTransaction(user!.uid, tx, asset)),
      addLoan: async (input) => {
        if (!user) throw new Error('Not signed in')
        const id = await createLoan(user.uid, input)
        await refresh({ silent: true })
        return id
      },
      editLoan: (id, input) => run(async () => updateLoan(user!.uid, id, input)),
      removeLoan: (id) => run(async () => deleteLoan(user!.uid, id)),
      addLoanPayment: (input, updateOutstanding) =>
        run(async () => {
          await createLoanPayment(user!.uid, input, updateOutstanding)
        }),
      addExpense: (input) =>
        run(async () => {
          await createExpense(user!.uid, input)
        }),
      removeExpense: (id) => run(async () => deleteExpense(user!.uid, id)),
      addIncome: (input) =>
        run(async () => {
          await createIncome(user!.uid, input)
        }),
      removeIncome: (id) => run(async () => deleteIncome(user!.uid, id)),
      addRecurringActivity: async (input) => {
        if (!user) throw new Error('Not signed in')
        const id = await createRecurringActivity(user.uid, input)
        await refresh({ silent: true })
        return id
      },
      editRecurringActivity: (id, input) =>
        run(async () => updateRecurringActivity(user!.uid, id, input)),
      removeRecurringActivity: (id) => run(async () => deleteRecurringActivity(user!.uid, id)),
      recordOccurrence: async (occurrence, params) => {
        if (!user) throw new Error('Not signed in')
        try {
          await recordScheduledOccurrence(user!.uid, occurrence, params, {
            assets: state.assets,
            loans: state.loans,
          })
          const recorded: ScheduledOccurrence = {
            ...occurrence,
            status: 'RECORDED',
            actualAmount: params.actualAmount,
            actualDate: params.actualDate,
            recordedAt: nowIso(),
            syncState: 'SYNCED',
          }
          setState((prev) => ({
            ...prev,
            scheduledOccurrences: prev.scheduledOccurrences.map((item) =>
              item.id === occurrence.id ? recorded : item,
            ),
          }))
          if (occurrence.type === 'INVESTMENT' || occurrence.type === 'LOAN_PAYMENT') {
            await refreshSummaries()
            await refreshActivity()
          } else {
            await refreshSummaries()
          }
        } catch (err) {
          logDevError(err)
          throw new Error(toUserMessage(err))
        }
      },
      skipOccurrence: async (occurrence, reason) => {
        if (!user) throw new Error('Not signed in')
        try {
          await skipScheduledOccurrence(user!.uid, occurrence, reason)
          const skipped: ScheduledOccurrence = {
            ...occurrence,
            status: 'SKIPPED',
            skipReason: reason,
            recordedAt: nowIso(),
            syncState: 'SYNCED',
          }
          setState((prev) => ({
            ...prev,
            scheduledOccurrences: prev.scheduledOccurrences.map((item) =>
              item.id === occurrence.id ? skipped : item,
            ),
          }))
        } catch (err) {
          logDevError(err)
          throw new Error(toUserMessage(err))
        }
      },
      exportJson: async () => {
        if (!user) throw new Error('Not signed in')
        return exportUserData(user.uid)
      },
    }),
    [
      state,
      loading,
      error,
      allRecurringActivities,
      wealthActivityCursor,
      wealthActivityHasMore,
      loanActivityCursor,
      loanActivityHasMore,
      refresh,
      refreshSummaries,
      refreshActivity,
      ensureWealthHistory,
      ensureGoalDetail,
      ensureLoanDetail,
      ensureStatementMonth,
      loadMoreWealthActivity,
      loadMoreLoanActivity,
      run,
      user,
    ],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceContextValue {
  const value = useContext(FinanceContext)
  if (!value) throw new Error('useFinance must be used within FinanceProvider')
  return value
}
