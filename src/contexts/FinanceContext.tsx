import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { logDevError, toUserMessage } from '@/lib/errors'
import {
  createAsset,
  createExpense,
  createGoal,
  createIncome,
  createLoan,
  createLoanPayment,
  createTransaction,
  deleteAsset,
  deleteExpense,
  deleteGoal,
  deleteIncome,
  deleteLoan,
  deleteTransaction,
  exportUserData,
  loadFinanceData,
  updateAsset,
  updateGoal,
  updateLoan,
} from '@/services/financeService'
import type { Asset } from '@/types/asset'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import type { AssetTransaction } from '@/types/transaction'

interface FinanceState {
  goals: Goal[]
  assets: Asset[]
  transactions: AssetTransaction[]
  loans: Loan[]
  loanPayments: LoanPayment[]
  expenses: Expense[]
  income: Income[]
}

interface FinanceContextValue extends FinanceState {
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addGoal: (input: Omit<Goal, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<string>
  editGoal: (id: string, input: Partial<Goal>) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  addAsset: (input: Omit<Asset, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<string>
  editAsset: (goalId: string, id: string, input: Partial<Asset>) => Promise<void>
  removeAsset: (goalId: string, id: string) => Promise<void>
  addTransaction: (
    input: Omit<AssetTransaction, 'id' | 'isDeleted' | 'createdAt' | 'month'>,
    asset: Asset,
  ) => Promise<void>
  removeTransaction: (tx: AssetTransaction, asset: Asset) => Promise<void>
  addLoan: (input: Omit<Loan, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => Promise<string>
  editLoan: (id: string, input: Partial<Loan>) => Promise<void>
  removeLoan: (id: string) => Promise<void>
  addLoanPayment: (
    input: Omit<LoanPayment, 'id' | 'isDeleted' | 'createdAt' | 'month'>,
    updateOutstanding?: boolean,
  ) => Promise<void>
  addExpense: (
    input: Omit<Expense, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'month'>,
  ) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  addIncome: (input: Omit<Income, 'id' | 'isDeleted' | 'createdAt' | 'month'>) => Promise<void>
  removeIncome: (id: string) => Promise<void>
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
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<FinanceState>(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setState(empty)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setState(await loadFinanceData(user.uid))
    } catch (err) {
      logDevError(err)
      setError(toUserMessage(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const run = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action()
        await refresh()
      } catch (err) {
        logDevError(err)
        throw new Error(toUserMessage(err))
      }
    },
    [refresh],
  )

  const value = useMemo<FinanceContextValue>(
    () => ({
      ...state,
      loading,
      error,
      refresh,
      addGoal: async (input) => {
        if (!user) throw new Error('Not signed in')
        const id = await createGoal(user.uid, input)
        await refresh()
        return id
      },
      editGoal: (id, input) => run(async () => updateGoal(user!.uid, id, input)),
      removeGoal: (id) => run(async () => deleteGoal(user!.uid, id)),
      addAsset: async (input) => {
        if (!user) throw new Error('Not signed in')
        const id = await createAsset(user.uid, input)
        await refresh()
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
        await refresh()
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
      exportJson: async () => {
        if (!user) throw new Error('Not signed in')
        return exportUserData(user.uid)
      },
    }),
    [state, loading, error, refresh, run, user],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceContextValue {
  const value = useContext(FinanceContext)
  if (!value) throw new Error('useFinance must be used within FinanceProvider')
  return value
}
