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
import { useDemo } from '@/contexts/DemoContext'
import { DEMO_USER_ID } from '@/demo/constants'
import { createDemoFinanceState } from '@/demo/demoData'
import { nextDemoId } from '@/demo/demoId'
import { migrateFirestoreV1 } from '@/dev/firestoreMigration'
import { runFirestoreOperation } from '@/firebase/performance'
import { SCHEMA_VERSION } from '@/firebase/schema'
import { mergeRecurringActivities, syncOccurrences } from '@/lib/calculations/recurring'
import { applyMonthlyDelta } from '@/lib/calculations/derived'
import { currentMonthKey, monthKeyFromDate, todayIsoDate } from '@/lib/formatters/dates'
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
  applyAssetPatch,
  applyExpensePatch,
  applyGoalPatch,
  applyIncomePatch,
  applyLoanPatch,
  applyLoanPaymentPatch,
  applyTransactionPatch,
  buildGoalFromInput,
  buildLoanFromInput,
  computeTransactionSideEffects,
  patchGoalInList,
  softDeleteById,
  type FinanceStateSlice,
} from '@/services/financeLocalPatch'
import {
  loadDashboardData,
  loadGoalDetailData,
  loadLoanDetailPayments,
  loadRecentLoanPayments,
  loadRecentTransactions,
  loadRecurringActivities,
  loadStatementMonthData,
  loadWealthHistoryTransactions,
} from '@/services/financeReads'
import { mapAsset } from '@/services/financeMappers'
import { nowIso } from '@/firebase/firestore'
import { emptyMonthlySummary } from '@/types/monthlySummary'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import type { MonthlySummary } from '@/types/monthlySummary'
import type { RecurringActivity, ScheduledOccurrence } from '@/types/recurring'
import { withFreeCashFlow } from '@/types/monthlySummary'
import type { AssetTransaction } from '@/types/transaction'
import type { QueryDocumentSnapshot } from 'firebase/firestore'

interface FinanceState extends FinanceStateSlice {}

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
  ensureRecentActivity: () => Promise<void>
  ensureRecurringActivities: () => Promise<void>
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

function monthSummary(state: FinanceState, month: string): MonthlySummary | null {
  return state.monthlySummaries[month] ?? (state.currentMonthlySummary?.month === month ? state.currentMonthlySummary : null)
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user, profile, settings } = useAuth()
  const { isDemoMode } = useDemo()
  const financeUid = isDemoMode ? DEMO_USER_ID : user?.uid
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
  const loadedRecentActivityRef = useRef(false)
  const loadedRecurringRef = useRef(false)
  const detailLoadsRef = useRef<Map<string, Promise<void>>>(new Map())
  const stateRef = useRef(state)
  stateRef.current = state

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

  const syncOccurrencesInBackground = useCallback(
    (uid: string, slice: FinanceStateSlice, recurringActivities: RecurringActivity[]) => {
      const today = todayIsoDate()
      const allActivities = mergeRecurringActivities(
        recurringActivities,
        slice.assets,
        slice.loans,
      )
      const occurrences = syncOccurrences(allActivities, slice.scheduledOccurrences, today)
      setState((prev) => ({ ...prev, scheduledOccurrences: occurrences }))
      if (isDemoMode) return
      void syncScheduledOccurrences(
        uid,
        {
          goals: slice.goals,
          assets: slice.assets,
          loans: slice.loans,
          recurringActivities,
          scheduledOccurrences: slice.scheduledOccurrences,
        },
        today,
      ).catch(logDevError)
    },
    [isDemoMode],
  )

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!financeUid) {
        setState(empty)
        return
      }
      if (!options?.silent) setLoading(true)
      setError(null)
      loadedGoalDetailsRef.current.clear()
      loadedLoanDetailsRef.current.clear()
      loadedStatementMonthsRef.current.clear()
      loadedWealthHistoryRef.current = false
      loadedRecentActivityRef.current = false
      loadedRecurringRef.current = false

      if (isDemoMode) {
        try {
          const demoState = createDemoFinanceState()
          const today = todayIsoDate()
          const occurrences = syncOccurrences(
            mergeRecurringActivities([], demoState.assets, demoState.loans),
            demoState.scheduledOccurrences,
            today,
          )
          loadedWealthHistoryRef.current = true
          loadedRecentActivityRef.current = true
          loadedRecurringRef.current = true
          for (const goal of demoState.goals) loadedGoalDetailsRef.current.add(goal.id)
          for (const loan of demoState.loans) loadedLoanDetailsRef.current.add(loan.id)
          for (const month of Object.keys(demoState.monthlySummaries)) {
            loadedStatementMonthsRef.current.add(month)
          }
          setWealthActivityCursor(null)
          setWealthActivityHasMore(false)
          setLoanActivityCursor(null)
          setLoanActivityHasMore(false)
          setState({ ...demoState, scheduledOccurrences: occurrences })
        } catch (err) {
          logDevError(err)
          setError(toUserMessage(err))
        } finally {
          if (!options?.silent) setLoading(false)
        }
        return
      }

      try {
        await runFirestoreOperation('Dashboard Load', async () => {
          if (!user) return
          const needsMigration = (profile?.schemaVersion ?? 1) < SCHEMA_VERSION
          if (needsMigration) {
            const migration = await migrateFirestoreV1(user.uid)
            if (!migration.success && import.meta.env.DEV) {
              console.warn('[nirvana] Firestore migration issue:', migration.error)
            }
          }

          const dashboard = await loadDashboardData(user.uid, dashboardMonth)
          const today = todayIsoDate()
          const occurrences = syncOccurrences(
            mergeRecurringActivities([], dashboard.assets, dashboard.loans),
            dashboard.scheduledOccurrences,
            today,
          )

          setWealthActivityCursor(dashboard.recentTransactionCursor)
          setWealthActivityHasMore(dashboard.recentTransactionHasMore)
          setLoanActivityCursor(null)
          setLoanActivityHasMore(false)

          const nextState: FinanceState = {
            goals: dashboard.goals,
            assets: dashboard.assets,
            loans: dashboard.loans,
            transactions: dashboard.recentTransactions,
            loanPayments: [],
            expenses: [],
            income: [],
            recurringActivities: [],
            scheduledOccurrences: occurrences,
            monthlySummaries: dashboard.monthlySummaries,
            currentMonthlySummary: dashboard.currentMonthlySummary,
          }
          setState(nextState)

          void runFirestoreOperation('Recurring Sync (background)', async () => {
            const recurringActivities = await loadRecurringActivities(user.uid)
            loadedRecurringRef.current = true
            setState((prev) => {
              syncOccurrencesInBackground(user!.uid, { ...prev, recurringActivities }, recurringActivities)
              return { ...prev, recurringActivities }
            })
          }).catch(logDevError)
        })
      } catch (err) {
        logDevError(err)
        setError(toUserMessage(err))
      } finally {
        if (!options?.silent) setLoading(false)
      }
    },
    [financeUid, isDemoMode, user, dashboardMonth, profile?.schemaVersion, syncOccurrencesInBackground],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  const ensureWealthHistory = useCallback(async () => {
    if (!financeUid || loadedWealthHistoryRef.current) return
    loadedWealthHistoryRef.current = true
    if (isDemoMode) return
    await runFirestoreOperation('Wealth History', async () => {
      const historyTransactions = await loadWealthHistoryTransactions(user!.uid, 13)
      setState((prev) => ({
        ...prev,
        transactions: mergeById(prev.transactions, historyTransactions),
      }))
    })
  }, [financeUid, isDemoMode, user])

  const ensureRecentActivity = useCallback(async () => {
    if (!financeUid || loadedRecentActivityRef.current) return
    loadedRecentActivityRef.current = true
    if (isDemoMode) return
    await runFirestoreOperation('Recent Activity', async () => {
      const recentActivity = await loadRecentTransactions(user!.uid)
      setWealthActivityCursor(recentActivity.cursor)
      setWealthActivityHasMore(recentActivity.hasMore)
      setState((prev) => ({
        ...prev,
        transactions: mergeById(prev.transactions, recentActivity.items),
      }))
    })
  }, [financeUid, isDemoMode, user])

  const ensureRecurringActivities = useCallback(async () => {
    if (!financeUid || loadedRecurringRef.current) return
    loadedRecurringRef.current = true
    if (isDemoMode) return
    await runFirestoreOperation('Recurring Activities', async () => {
      const recurringActivities = await loadRecurringActivities(user!.uid)
      setState((prev) => {
        syncOccurrencesInBackground(user!.uid, { ...prev, recurringActivities }, recurringActivities)
        return { ...prev, recurringActivities }
      })
    })
  }, [financeUid, isDemoMode, user, syncOccurrencesInBackground])

  const ensureGoalDetail = useCallback(
    async (goalId: string) => {
      if (!financeUid || loadedGoalDetailsRef.current.has(goalId)) return
      if (isDemoMode) {
        loadedGoalDetailsRef.current.add(goalId)
        return
      }
      await runDetailLoad(`goal:${goalId}`, async () => {
        await runFirestoreOperation('Goal Detail', async () => {
          const detail = await loadGoalDetailData(user!.uid, goalId)
          setState((prev) => ({
            ...prev,
            assets: mergeById(prev.assets, detail.assets),
            transactions: mergeById(prev.transactions, detail.transactions),
          }))
        })
        loadedGoalDetailsRef.current.add(goalId)
      })
    },
    [financeUid, isDemoMode, user, runDetailLoad],
  )

  const ensureLoanDetail = useCallback(
    async (loanId: string) => {
      if (!financeUid || loadedLoanDetailsRef.current.has(loanId)) return
      if (isDemoMode) {
        loadedLoanDetailsRef.current.add(loanId)
        return
      }
      await runDetailLoad(`loan:${loanId}`, async () => {
        await runFirestoreOperation('Loan Detail', async () => {
          const payments = await loadLoanDetailPayments(user!.uid, loanId)
          setState((prev) => ({
            ...prev,
            loanPayments: mergeById(prev.loanPayments, payments),
          }))
        })
        loadedLoanDetailsRef.current.add(loanId)
      })
    },
    [financeUid, isDemoMode, user, runDetailLoad],
  )

  const ensureStatementMonth = useCallback(
    async (month: string) => {
      if (!financeUid || loadedStatementMonthsRef.current.has(month)) return
      if (isDemoMode) {
        loadedStatementMonthsRef.current.add(month)
        return
      }
      await runDetailLoad(`statement:${month}`, async () => {
        await runFirestoreOperation('Statement Month', async () => {
          const data = await loadStatementMonthData(user!.uid, month)
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
              month === dashboardMonth
                ? data.summary ?? prev.currentMonthlySummary
                : prev.currentMonthlySummary,
          }))
        })
        loadedStatementMonthsRef.current.add(month)
      })
    },
    [financeUid, isDemoMode, user, dashboardMonth, runDetailLoad],
  )

  const loadMoreWealthActivity = useCallback(async () => {
    if (!financeUid || !wealthActivityHasMore || isDemoMode) return
    const page = await loadRecentTransactions(user!.uid, undefined, wealthActivityCursor)
    setWealthActivityCursor(page.cursor)
    setWealthActivityHasMore(page.hasMore)
    setState((prev) => ({
      ...prev,
      transactions: mergeById(prev.transactions, page.items),
    }))
  }, [financeUid, isDemoMode, user, wealthActivityCursor, wealthActivityHasMore])

  const loadMoreLoanActivity = useCallback(async () => {
    if (!financeUid || !loanActivityHasMore || isDemoMode) return
    const page = await loadRecentLoanPayments(user!.uid, undefined, loanActivityCursor)
    setLoanActivityCursor(page.cursor)
    setLoanActivityHasMore(page.hasMore)
    setState((prev) => ({
      ...prev,
      loanPayments: mergeById(prev.loanPayments, page.items),
    }))
  }, [financeUid, isDemoMode, user, loanActivityCursor, loanActivityHasMore])

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
      ensureRecentActivity,
      ensureRecurringActivities,
      ensureGoalDetail,
      ensureLoanDetail,
      ensureStatementMonth,
      loadMoreWealthActivity,
      loadMoreLoanActivity,
      addGoal: async (input) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          const id = nextDemoId('goal')
          const goal = buildGoalFromInput(id, financeUid, input)
          setState((prev) => applyGoalPatch(prev, goal))
          return id
        }
        const id = await runFirestoreOperation('Create Goal', () => createGoal(user!.uid, input))
        const goal = buildGoalFromInput(id, user!.uid, input)
        setState((prev) => applyGoalPatch(prev, goal))
        return id
      },
      editGoal: async (id, input) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          setState((prev) => ({
            ...prev,
            goals: prev.goals.map((goal) =>
              goal.id === id ? { ...goal, ...input, updatedAt: nowIso() } : goal,
            ),
          }))
          return
        }
        await runFirestoreOperation('Edit Goal', () => updateGoal(user!.uid, id, input))
        setState((prev) => ({
          ...prev,
          goals: prev.goals.map((goal) =>
            goal.id === id ? { ...goal, ...input, updatedAt: nowIso() } : goal,
          ),
        }))
      },
      removeGoal: async (id) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          setState((prev) => ({
            ...prev,
            goals: prev.goals.map((goal) =>
              goal.id === id ? { ...goal, isDeleted: true, status: 'paused', updatedAt: nowIso() } : goal,
            ),
          }))
          return
        }
        await runFirestoreOperation('Delete Goal', () => deleteGoal(user!.uid, id))
        setState((prev) => ({
          ...prev,
          goals: prev.goals.map((goal) =>
            goal.id === id ? { ...goal, isDeleted: true, status: 'paused', updatedAt: nowIso() } : goal,
          ),
        }))
      },
      addAsset: async (input) => {
        if (!financeUid) throw new Error('Not signed in')
        const goalAssets = stateRef.current.assets.filter(
          (item) => item.goalId === input.goalId && !item.isDeleted,
        )
        if (isDemoMode) {
          const id = nextDemoId('asset')
          const now = nowIso()
          const mapped = mapAsset(
            {
              ...input,
              id,
              userId: financeUid,
              isDeleted: false,
              createdAt: now,
              updatedAt: now,
            },
            input.goalId,
          )
          setState((prev) => {
            const goals = patchGoalInList(prev.goals, input.goalId, {}, [...prev.assets, mapped])
            return applyAssetPatch({ ...prev, goals }, mapped)
          })
          return id
        }
        const id = await runFirestoreOperation('Create Asset', () =>
          createAsset(user!.uid, input, { goalAssets }),
        )
        const now = nowIso()
        const mapped = mapAsset(
          {
            ...input,
            id,
            userId: user!.uid,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          },
          input.goalId,
        )
        setState((prev) => {
          const goals = patchGoalInList(prev.goals, input.goalId, {}, [...prev.assets, mapped])
          return applyAssetPatch({ ...prev, goals }, mapped)
        })
        return id
      },
      editAsset: async (goalId, id, input) => {
        if (!financeUid) throw new Error('Not signed in')
        const existing = stateRef.current.assets.find((item) => item.id === id)
        if (!existing) throw new Error('Asset not found')
        const goalAssets = stateRef.current.assets.filter(
          (item) => item.goalId === goalId && !item.isDeleted,
        )
        if (isDemoMode) {
          const merged = mapAsset({ ...existing, ...input, id }, goalId)
          setState((prev) => {
            const assets = prev.assets.map((item) => (item.id === id ? merged : item))
            const goals = patchGoalInList(prev.goals, goalId, {}, assets)
            return { ...prev, assets, goals }
          })
          return
        }
        await runFirestoreOperation('Edit Asset', () =>
          updateAsset(user!.uid, goalId, id, input, { existing, goalAssets }),
        )
        const merged = mapAsset({ ...existing, ...input, id }, goalId)
        setState((prev) => {
          const assets = prev.assets.map((item) => (item.id === id ? merged : item))
          const goals = patchGoalInList(prev.goals, goalId, {}, assets)
          return { ...prev, assets, goals }
        })
      },
      removeAsset: async (goalId, id) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          setState((prev) => {
            const assets = prev.assets.map((item) =>
              item.id === id ? { ...item, isDeleted: true, isActive: false, updatedAt: nowIso() } : item,
            )
            const goals = patchGoalInList(prev.goals, goalId, {}, assets)
            return { ...prev, assets, goals }
          })
          return
        }
        const goalAssets = stateRef.current.assets.filter(
          (item) => item.goalId === goalId && !item.isDeleted && item.id !== id,
        )
        await runFirestoreOperation('Delete Asset', () =>
          deleteAsset(user!.uid, goalId, id, { goalAssets }),
        )
        setState((prev) => {
          const assets = prev.assets.map((item) =>
            item.id === id ? { ...item, isDeleted: true, isActive: false, updatedAt: nowIso() } : item,
          )
          const goals = patchGoalInList(prev.goals, goalId, {}, assets)
          return { ...prev, assets, goals }
        })
      },
      addTransaction: async (input, asset) => {
        if (!financeUid) throw new Error('Not signed in')
        const goal = stateRef.current.goals.find((item) => item.id === input.goalId)
        if (!goal) throw new Error('Goal not found')
        const month = monthKeyFromDate(input.date)
        if (isDemoMode) {
          const id = nextDemoId('tx')
          const tx: AssetTransaction = {
            ...input,
            id,
            userId: financeUid,
            month,
            isDeleted: false,
            createdAt: nowIso(),
          }
          const effects = computeTransactionSideEffects(
            asset,
            tx,
            goal,
            stateRef.current.assets,
            monthSummary(stateRef.current, month),
          )
          setState((prev) =>
            applyTransactionPatch(
              prev,
              tx,
              effects.asset,
              effects.goal,
              effects.monthlySummary,
              dashboardMonth,
            ),
          )
          return
        }
        const siblingAssetIds = stateRef.current.assets
          .filter((item) => item.goalId === input.goalId && item.id !== asset.id && !item.isDeleted)
          .map((item) => item.id)
        const result = await runFirestoreOperation('Add Investment', () =>
          createTransaction(user!.uid, input, asset, { siblingAssetIds }),
        )
        const effects = computeTransactionSideEffects(
          asset,
          result.transaction,
          goal,
          stateRef.current.assets,
          monthSummary(stateRef.current, month),
        )
        setState((prev) =>
          applyTransactionPatch(
            prev,
            result.transaction,
            effects.asset,
            effects.goal,
            effects.monthlySummary,
            dashboardMonth,
          ),
        )
      },
      removeTransaction: async (tx, asset) => {
        if (!financeUid) throw new Error('Not signed in')
        const goal = stateRef.current.goals.find((item) => item.id === tx.goalId)
        if (!goal) throw new Error('Goal not found')
        if (isDemoMode) {
          let nextAsset = { ...asset }
          if (tx.type === 'INVESTMENT') {
            nextAsset.investedAmount = Math.max(0, nextAsset.investedAmount - tx.amount)
            nextAsset.currentValue = Math.max(0, nextAsset.currentValue - tx.amount)
          } else if (tx.type === 'WITHDRAWAL') {
            nextAsset.totalWithdrawals = Math.max(0, nextAsset.totalWithdrawals - tx.amount)
            nextAsset.currentValue += tx.amount
          } else {
            nextAsset.currentValue = tx.amount
          }
          nextAsset = mapAsset({ ...nextAsset, updatedAt: nowIso() }, tx.goalId)
          const delta =
            tx.type === 'INVESTMENT'
              ? { investments: -tx.amount, transactionCount: -1 }
              : tx.type === 'WITHDRAWAL'
                ? { withdrawals: -tx.amount, transactionCount: -1 }
                : { transactionCount: -1 }
          const monthlySummary = applyMonthlyDelta(
            monthSummary(stateRef.current, tx.month) ?? emptyMonthlySummary(tx.month),
            tx.month,
            delta,
          )
          setState((prev) => {
            const goals = patchGoalInList(
              prev.goals,
              tx.goalId,
              {},
              prev.assets.map((item) => (item.id === asset.id ? nextAsset : item)),
            )
            return {
              ...prev,
              goals,
              assets: prev.assets.map((item) => (item.id === asset.id ? nextAsset : item)),
              transactions: prev.transactions.map((item) =>
                item.id === tx.id ? { ...item, isDeleted: true } : item,
              ),
              monthlySummaries: { ...prev.monthlySummaries, [tx.month]: monthlySummary },
              currentMonthlySummary:
                tx.month === dashboardMonth ? monthlySummary : prev.currentMonthlySummary,
            }
          })
          return
        }
        const siblingAssetIds = stateRef.current.assets
          .filter((item) => item.goalId === tx.goalId && item.id !== asset.id && !item.isDeleted)
          .map((item) => item.id)
        await runFirestoreOperation('Delete Transaction', () =>
          deleteTransaction(user!.uid, tx, asset, { siblingAssetIds }),
        )
        let nextAsset = { ...asset }
        if (tx.type === 'INVESTMENT') {
          nextAsset.investedAmount = Math.max(0, nextAsset.investedAmount - tx.amount)
          nextAsset.currentValue = Math.max(0, nextAsset.currentValue - tx.amount)
        } else if (tx.type === 'WITHDRAWAL') {
          nextAsset.totalWithdrawals = Math.max(0, nextAsset.totalWithdrawals - tx.amount)
          nextAsset.currentValue += tx.amount
        } else {
          nextAsset.currentValue = tx.amount
        }
        nextAsset = mapAsset({ ...nextAsset, updatedAt: nowIso() }, tx.goalId)
        const delta =
          tx.type === 'INVESTMENT'
            ? { investments: -tx.amount, transactionCount: -1 }
            : tx.type === 'WITHDRAWAL'
              ? { withdrawals: -tx.amount, transactionCount: -1 }
              : { transactionCount: -1 }
        const monthlySummary = applyMonthlyDelta(
          monthSummary(stateRef.current, tx.month) ?? emptyMonthlySummary(tx.month),
          tx.month,
          delta,
        )
        setState((prev) => {
          const goals = patchGoalInList(
            prev.goals,
            tx.goalId,
            {},
            prev.assets.map((item) => (item.id === asset.id ? nextAsset : item)),
          )
          return {
            ...prev,
            goals,
            assets: prev.assets.map((item) => (item.id === asset.id ? nextAsset : item)),
            transactions: prev.transactions.map((item) =>
              item.id === tx.id ? { ...item, isDeleted: true } : item,
            ),
            monthlySummaries: { ...prev.monthlySummaries, [tx.month]: monthlySummary },
            currentMonthlySummary:
              tx.month === dashboardMonth ? monthlySummary : prev.currentMonthlySummary,
          }
        })
      },
      addLoan: async (input) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          const id = nextDemoId('loan')
          const loan = buildLoanFromInput(id, financeUid, input)
          setState((prev) => applyLoanPatch(prev, loan))
          return id
        }
        const id = await runFirestoreOperation('Create Loan', () => createLoan(user!.uid, input))
        const loan = buildLoanFromInput(id, user!.uid, input)
        setState((prev) => applyLoanPatch(prev, loan))
        return id
      },
      editLoan: async (id, input) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          setState((prev) => ({
            ...prev,
            loans: prev.loans.map((loan) =>
              loan.id === id ? { ...loan, ...input, updatedAt: nowIso() } : loan,
            ),
          }))
          return
        }
        await runFirestoreOperation('Edit Loan', () => updateLoan(user!.uid, id, input))
        setState((prev) => ({
          ...prev,
          loans: prev.loans.map((loan) =>
            loan.id === id ? { ...loan, ...input, updatedAt: nowIso() } : loan,
          ),
        }))
      },
      removeLoan: async (id) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          setState((prev) => ({
            ...prev,
            loans: prev.loans.map((loan) =>
              loan.id === id ? { ...loan, isDeleted: true, status: 'CLOSED', updatedAt: nowIso() } : loan,
            ),
          }))
          return
        }
        await runFirestoreOperation('Delete Loan', () => deleteLoan(user!.uid, id))
        setState((prev) => ({
          ...prev,
          loans: prev.loans.map((loan) =>
            loan.id === id ? { ...loan, isDeleted: true, status: 'CLOSED', updatedAt: nowIso() } : loan,
          ),
        }))
      },
      addLoanPayment: async (input, updateOutstanding = true) => {
        if (!financeUid) throw new Error('Not signed in')
        const loan = stateRef.current.loans.find((item) => item.id === input.loanId)
        if (!loan) throw new Error('Loan not found')
        const month = monthKeyFromDate(input.date)
        if (isDemoMode) {
          const id = nextDemoId('loan-pay')
          const payment: LoanPayment = {
            ...input,
            id,
            userId: financeUid,
            month,
            isDeleted: false,
            createdAt: nowIso(),
          }
          const principal = input.principalAmount ?? input.amount
          let nextLoan = loan
          if (updateOutstanding) {
            const outstandingAmount = Math.max(0, loan.outstandingAmount - principal)
            const totalPaid = Math.max(0, loan.originalAmount - outstandingAmount)
            nextLoan = {
              ...loan,
              outstandingAmount,
              totalPaid,
              progressPercentage:
                loan.originalAmount <= 0 ? 0 : (totalPaid / loan.originalAmount) * 100,
              updatedAt: nowIso(),
            }
          }
          const monthlySummary = withFreeCashFlow(
            applyMonthlyDelta(
              monthSummary(stateRef.current, month) ?? emptyMonthlySummary(month),
              month,
              { loanPayments: input.amount, transactionCount: 1 },
            ),
          )
          setState((prev) =>
            applyLoanPaymentPatch(prev, payment, nextLoan, monthlySummary, dashboardMonth),
          )
          return
        }
        const result = await runFirestoreOperation('Record Loan Payment', () =>
          createLoanPayment(user!.uid, input, updateOutstanding, {
            loan,
            currentSummary: monthSummary(stateRef.current, month),
          }),
        )
        setState((prev) =>
          applyLoanPaymentPatch(
            prev,
            result.payment,
            result.loan,
            result.monthlySummary,
            dashboardMonth,
          ),
        )
      },
      addExpense: async (input) => {
        if (!financeUid) throw new Error('Not signed in')
        const month = monthKeyFromDate(input.date)
        if (isDemoMode) {
          const id = nextDemoId('expense')
          const expense: Expense = {
            ...input,
            id,
            userId: financeUid,
            month,
            isDeleted: false,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          const delta =
            input.category !== 'EMI'
              ? { expenses: input.amount, transactionCount: 1 }
              : { loanPayments: input.amount, transactionCount: 1 }
          const monthlySummary = withFreeCashFlow(
            applyMonthlyDelta(
              monthSummary(stateRef.current, month) ?? emptyMonthlySummary(month),
              month,
              delta,
            ),
          )
          setState((prev) =>
            applyExpensePatch(prev, expense, monthlySummary, dashboardMonth),
          )
          return
        }
        const result = await runFirestoreOperation('Add Expense', () =>
          createExpense(user!.uid, input, {
            currentSummary: monthSummary(stateRef.current, month),
          }),
        )
        setState((prev) =>
          applyExpensePatch(prev, result.expense, result.monthlySummary, dashboardMonth),
        )
      },
      removeExpense: async (id) => {
        if (!financeUid) throw new Error('Not signed in')
        const expense = stateRef.current.expenses.find((item) => item.id === id)
        if (isDemoMode) {
          if (expense) {
            const delta =
              expense.category !== 'EMI'
                ? { expenses: -expense.amount, transactionCount: -1 }
                : { loanPayments: -expense.amount, transactionCount: -1 }
            const monthlySummary = applyMonthlyDelta(
              monthSummary(stateRef.current, expense.month) ?? emptyMonthlySummary(expense.month),
              expense.month,
              delta,
            )
            setState((prev) => ({
              ...prev,
              expenses: softDeleteById(prev.expenses, id),
              monthlySummaries: { ...prev.monthlySummaries, [expense.month]: monthlySummary },
              currentMonthlySummary:
                expense.month === dashboardMonth ? monthlySummary : prev.currentMonthlySummary,
            }))
          }
          return
        }
        await runFirestoreOperation('Delete Expense', () => deleteExpense(user!.uid, id))
        if (expense) {
          const delta =
            expense.category !== 'EMI'
              ? { expenses: -expense.amount, transactionCount: -1 }
              : { loanPayments: -expense.amount, transactionCount: -1 }
          const monthlySummary = applyMonthlyDelta(
            monthSummary(stateRef.current, expense.month) ?? emptyMonthlySummary(expense.month),
            expense.month,
            delta,
          )
          setState((prev) => ({
            ...prev,
            expenses: softDeleteById(prev.expenses, id),
            monthlySummaries: { ...prev.monthlySummaries, [expense.month]: monthlySummary },
            currentMonthlySummary:
              expense.month === dashboardMonth ? monthlySummary : prev.currentMonthlySummary,
          }))
        }
      },
      addIncome: async (input) => {
        if (!financeUid) throw new Error('Not signed in')
        const month = monthKeyFromDate(input.date)
        if (isDemoMode) {
          const id = nextDemoId('income')
          const income: Income = {
            ...input,
            id,
            userId: financeUid,
            month,
            isDeleted: false,
            createdAt: nowIso(),
          }
          const monthlySummary = withFreeCashFlow(
            applyMonthlyDelta(
              monthSummary(stateRef.current, month) ?? emptyMonthlySummary(month),
              month,
              { income: input.amount, transactionCount: 1 },
            ),
          )
          setState((prev) =>
            applyIncomePatch(prev, income, monthlySummary, dashboardMonth),
          )
          return
        }
        const result = await runFirestoreOperation('Add Income', () =>
          createIncome(user!.uid, input, {
            currentSummary: monthSummary(stateRef.current, month),
          }),
        )
        setState((prev) =>
          applyIncomePatch(prev, result.income, result.monthlySummary, dashboardMonth),
        )
      },
      removeIncome: async (id) => {
        if (!financeUid) throw new Error('Not signed in')
        const income = stateRef.current.income.find((item) => item.id === id)
        if (isDemoMode) {
          if (income) {
            const monthlySummary = applyMonthlyDelta(
              monthSummary(stateRef.current, income.month) ?? emptyMonthlySummary(income.month),
              income.month,
              { income: -income.amount, transactionCount: -1 },
            )
            setState((prev) => ({
              ...prev,
              income: softDeleteById(prev.income, id),
              monthlySummaries: { ...prev.monthlySummaries, [income.month]: monthlySummary },
              currentMonthlySummary:
                income.month === dashboardMonth ? monthlySummary : prev.currentMonthlySummary,
            }))
          }
          return
        }
        await runFirestoreOperation('Delete Income', () => deleteIncome(user!.uid, id))
        if (income) {
          const monthlySummary = applyMonthlyDelta(
            monthSummary(stateRef.current, income.month) ?? emptyMonthlySummary(income.month),
            income.month,
            { income: -income.amount, transactionCount: -1 },
          )
          setState((prev) => ({
            ...prev,
            income: softDeleteById(prev.income, id),
            monthlySummaries: { ...prev.monthlySummaries, [income.month]: monthlySummary },
            currentMonthlySummary:
              income.month === dashboardMonth ? monthlySummary : prev.currentMonthlySummary,
          }))
        }
      },
      addRecurringActivity: async (input) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          const id = nextDemoId('recurring')
          const now = nowIso()
          const activity: RecurringActivity = {
            ...input,
            id,
            userId: financeUid,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          }
          setState((prev) => ({
            ...prev,
            recurringActivities: [...prev.recurringActivities, activity],
          }))
          return id
        }
        const id = await runFirestoreOperation('Create Recurring Activity', () =>
          createRecurringActivity(user!.uid, input),
        )
        const now = nowIso()
        const activity: RecurringActivity = {
          ...input,
          id,
          userId: user!.uid,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }
        setState((prev) => ({
          ...prev,
          recurringActivities: [...prev.recurringActivities, activity],
        }))
        return id
      },
      editRecurringActivity: async (id, input) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          setState((prev) => ({
            ...prev,
            recurringActivities: prev.recurringActivities.map((item) =>
              item.id === id ? { ...item, ...input, updatedAt: nowIso() } : item,
            ),
          }))
          return
        }
        await runFirestoreOperation('Edit Recurring Activity', () =>
          updateRecurringActivity(user!.uid, id, input),
        )
        setState((prev) => ({
          ...prev,
          recurringActivities: prev.recurringActivities.map((item) =>
            item.id === id ? { ...item, ...input, updatedAt: nowIso() } : item,
          ),
        }))
      },
      removeRecurringActivity: async (id) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          setState((prev) => ({
            ...prev,
            recurringActivities: prev.recurringActivities.map((item) =>
              item.id === id
                ? { ...item, isDeleted: true, status: 'PAUSED', updatedAt: nowIso() }
                : item,
            ),
          }))
          return
        }
        await runFirestoreOperation('Delete Recurring Activity', () =>
          deleteRecurringActivity(user!.uid, id),
        )
        setState((prev) => ({
          ...prev,
          recurringActivities: prev.recurringActivities.map((item) =>
            item.id === id
              ? { ...item, isDeleted: true, status: 'PAUSED', updatedAt: nowIso() }
              : item,
          ),
        }))
      },
      recordOccurrence: async (occurrence, params) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
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
          return
        }
        const month = monthKeyFromDate(params.actualDate)
        const result = await runFirestoreOperation('Record Occurrence', () =>
          recordScheduledOccurrence(user!.uid, occurrence, params, {
            assets: stateRef.current.assets,
            loans: stateRef.current.loans,
            currentSummary: monthSummary(stateRef.current, month),
            month,
          }),
        )
        setState((prev) => {
          let next: FinanceState = {
            ...prev,
            scheduledOccurrences: prev.scheduledOccurrences.map((item) =>
              item.id === occurrence.id ? result.occurrence : item,
            ),
          }
          if (result.transaction) {
            const goal = prev.goals.find((item) => item.id === result.transaction!.transaction.goalId)
            const asset = prev.assets.find((item) => item.id === result.transaction!.transaction.assetId)
            if (goal && asset) {
              const effects = computeTransactionSideEffects(
                asset,
                result.transaction.transaction,
                goal,
                prev.assets,
                monthSummary(prev, month),
              )
              next = applyTransactionPatch(
                next,
                result.transaction.transaction,
                effects.asset,
                effects.goal,
                effects.monthlySummary,
                dashboardMonth,
              )
            }
          }
          if (result.loanPayment) {
            next = applyLoanPaymentPatch(
              next,
              result.loanPayment.payment,
              result.loanPayment.loan,
              result.loanPayment.monthlySummary,
              dashboardMonth,
            )
          }
          if (result.expense) {
            next = applyExpensePatch(
              next,
              result.expense.expense,
              result.expense.monthlySummary,
              dashboardMonth,
            )
          }
          if (result.income) {
            next = applyIncomePatch(
              next,
              result.income.income,
              result.income.monthlySummary,
              dashboardMonth,
            )
          }
          return next
        })
      },
      skipOccurrence: async (occurrence, reason) => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
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
          return
        }
        await runFirestoreOperation('Skip Occurrence', () =>
          skipScheduledOccurrence(user!.uid, occurrence, reason),
        )
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
      },
      exportJson: async () => {
        if (!financeUid) throw new Error('Not signed in')
        if (isDemoMode) {
          return {
            ...stateRef.current,
            demo: true,
            exportedAt: nowIso(),
          }
        }
        return exportUserData(user!.uid)
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
      ensureWealthHistory,
      ensureRecentActivity,
      ensureRecurringActivities,
      ensureGoalDetail,
      ensureLoanDetail,
      ensureStatementMonth,
      loadMoreWealthActivity,
      loadMoreLoanActivity,
      user,
      financeUid,
      isDemoMode,
      dashboardMonth,
    ],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceContextValue {
  const value = useContext(FinanceContext)
  if (!value) throw new Error('useFinance must be used within FinanceProvider')
  return value
}
