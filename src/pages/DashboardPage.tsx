import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, ConfirmBar, EmptyState, Progress } from '@/components/ui'
import { QuickSheets, type QuickSheet } from '@/components/QuickSheets'
import {
  AllocationList,
  CashFlowBars,
  ChartCard,
  DonutChart,
  GoalProgressBars,
  WealthGrowthChart,
} from '@/components/charts'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import { calculateMonthlyCashFlow } from '@/lib/calculations/cashflow'
import { calculateFinancialHealth } from '@/lib/calculations/financialHealth'
import { calculateGoalMetrics, weightedGoalProgress } from '@/lib/calculations/goals'
import {
  calculateLoanMetrics,
  loanBurdenRatio,
  totalMonthlyEmi,
  totalOutstanding,
} from '@/lib/calculations/loans'
import {
  currentMonthKey,
  formatDisplayDate,
  formatMonthLabel,
  greetingForNow,
  monthKeyFromDate,
  shiftMonth,
  todayIsoDate,
} from '@/lib/formatters/dates'
import { buildAggregateWealthGrowth } from '@/lib/calculations/projections'
import { formatMoney, formatPercent } from '@/lib/formatters/currency'
import { firstName } from '@/lib/utils'
import { ASSET_CATEGORY_LABELS } from '@/types/asset'

export function DashboardPage() {
  const { profile, settings, saveSettings } = useAuth()
  const finance = useFinance()
  const [sheet, setSheet] = useState<QuickSheet>(null)
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)
  const [deletingIncome, setDeletingIncome] = useState<string | null>(null)
  const currency = profile?.currency ?? 'INR'
  const month = settings?.dashboardMonth ?? currentMonthKey()
  const asOf = todayIsoDate()

  const cashflow = useMemo(
    () =>
      calculateMonthlyCashFlow({
        income: finance.income,
        expenses: finance.expenses,
        transactions: finance.transactions,
        loans: finance.loans,
        month,
        includeScheduledEmi: true,
      }),
    [finance, month],
  )

  const allocation = useMemo(() => {
    const map = new Map<string, number>()
    for (const asset of finance.assets) {
      if (asset.isDeleted) continue
      map.set(asset.category, (map.get(asset.category) ?? 0) + asset.currentValue)
    }
    return [...map.entries()].map(([category, value]) => ({
      name:
        ASSET_CATEGORY_LABELS[category as keyof typeof ASSET_CATEGORY_LABELS] ?? category,
      value,
    }))
  }, [finance.assets])

  const counts = useMemo(() => {
    if (finance.loading) {
      return { goals: 0, loans: 0, assets: 0, transactions: 0, expenses: 0, income: 0 }
    }
    return {
      goals: finance.goals.length,
      loans: finance.loans.length,
      assets: finance.assets.length,
      transactions: finance.transactions.length,
      expenses: finance.expenses.length,
      income: finance.income.length,
    }
  }, [finance])

  const assetsTotal = finance.assets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const loansTotal = totalOutstanding(finance.loans)
  const net = assetsTotal - loansTotal
  const emi = totalMonthlyEmi(finance.loans)
  const goalProgress = weightedGoalProgress(finance.goals, finance.assets, asOf)
  const health = calculateFinancialHealth({
    income: cashflow.income,
    expenses: cashflow.expenses,
    investments: cashflow.investments,
    emis: cashflow.loanPayments,
    wealthGoalProgress: goalProgress,
  })

  const cashBars = useMemo(
    () => [
      {
        label: 'Income',
        value: cashflow.income,
        positive: true,
        max: Math.max(
          cashflow.income,
          cashflow.expenses,
          cashflow.investments,
          cashflow.loanPayments,
          1,
        ),
      },
      {
        label: 'Expenses',
        value: cashflow.expenses,
        max: Math.max(
          cashflow.income,
          cashflow.expenses,
          cashflow.investments,
          cashflow.loanPayments,
          1,
        ),
      },
      {
        label: 'Investments',
        value: cashflow.investments,
        max: Math.max(
          cashflow.income,
          cashflow.expenses,
          cashflow.investments,
          cashflow.loanPayments,
          1,
        ),
      },
      {
        label: 'Loans',
        value: cashflow.loanPayments,
        max: Math.max(
          cashflow.income,
          cashflow.expenses,
          cashflow.investments,
          cashflow.loanPayments,
          1,
        ),
      },
      {
        label: 'Remaining',
        value: cashflow.freeCashFlow,
        positive: cashflow.freeCashFlow >= 0,
        max: Math.max(
          cashflow.income,
          cashflow.expenses,
          cashflow.investments,
          cashflow.loanPayments,
          1,
        ),
      },
    ],
    [cashflow],
  )

  const wealthGrowth = useMemo(
    () => buildAggregateWealthGrowth(finance.goals, finance.assets, asOf),
    [finance.goals, finance.assets, asOf],
  )

  const goalBars = useMemo(
    () =>
      finance.goals.map((goal) => {
        const metrics = calculateGoalMetrics(goal, finance.assets, asOf)
        return {
          name: goal.name,
          current: metrics.currentValue,
          target: metrics.targetAmount,
        }
      }),
    [finance.goals, finance.assets, asOf],
  )

  const emiByLoan = useMemo(
    () =>
      finance.loans
        .filter((loan) => !loan.isDeleted && loan.status === 'ACTIVE')
        .map((loan) => ({ name: loan.name, value: loan.emiAmount })),
    [finance.loans],
  )

  const monthExpenses = useMemo(
    () =>
      finance.expenses
        .filter((item) => item.month === month || monthKeyFromDate(item.date) === month)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [finance.expenses, month],
  )

  const monthIncome = useMemo(
    () =>
      finance.income
        .filter((item) => item.month === month || monthKeyFromDate(item.date) === month)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [finance.income, month],
  )

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-stone-500">
          {greetingForNow()}, {firstName(profile?.displayName)}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your money today</h1>
      </header>

      <Card>
        <p className="text-sm text-stone-500">Net position</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {formatMoney(net, currency, { compact: true })}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-stone-500">Total assets</p>
            <p className="font-semibold text-emerald-700">
              {formatMoney(assetsTotal, currency, { compact: true })}
            </p>
          </div>
          <div>
            <p className="text-stone-500">Total loans</p>
            <p className="font-semibold text-red-700">
              {formatMoney(loansTotal, currency, { compact: true })}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button
            className="min-h-11 px-2"
            onClick={() => void saveSettings({ dashboardMonth: shiftMonth(month, -1) })}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <h2 className="font-semibold">{formatMonthLabel(month)}</h2>
          <button
            className="min-h-11 px-2"
            onClick={() => void saveSettings({ dashboardMonth: shiftMonth(month, 1) })}
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          {(
            [
              ['Income', cashflow.income, false],
              ['Expenses', cashflow.expenses, true],
              ['Investments', cashflow.investments, true],
              ['Loans', cashflow.loanPayments, true],
              ['Free cash flow', cashflow.freeCashFlow, cashflow.freeCashFlow < 0],
            ] as const
          ).map(([label, value, negative]) => (
            <div key={label} className="flex items-center justify-between">
              <dt className="text-stone-500">{label}</dt>
              <dd className={negative ? 'font-semibold text-red-700' : 'font-semibold'}>
                {formatMoney(value, currency, { compact: true })}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
          <CashFlowBars items={cashBars} />
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">This month</h2>
        {monthIncome.length === 0 && monthExpenses.length === 0 ? (
          <p className="text-sm text-stone-500">
            No income or expenses recorded for {formatMonthLabel(month)}.
          </p>
        ) : (
          <div className="space-y-3">
            {monthIncome.length > 0 ? (
              <Card>
                <h3 className="mb-3 text-sm font-semibold text-stone-500">Income</h3>
                <ul className="space-y-2">
                  {monthIncome.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">{item.source}</p>
                        <p className="text-xs text-stone-500">
                          {formatDisplayDate(item.date)}
                          {item.description ? ` · ${item.description}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-700">
                          {formatMoney(item.amount, currency, { compact: true })}
                        </span>
                        <button
                          type="button"
                          className="min-h-11 min-w-11 rounded-xl text-stone-400 hover:text-red-600"
                          aria-label="Delete income"
                          onClick={() => setDeletingIncome(item.id)}
                        >
                          <Trash2 className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
            {monthExpenses.length > 0 ? (
              <Card>
                <h3 className="mb-3 text-sm font-semibold text-stone-500">Expenses</h3>
                <ul className="space-y-2">
                  {monthExpenses.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">{item.category}</p>
                        <p className="text-xs text-stone-500">
                          {formatDisplayDate(item.date)}
                          {item.description ? ` · ${item.description}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {formatMoney(item.amount, currency, { compact: true })}
                        </span>
                        <button
                          type="button"
                          className="min-h-11 min-w-11 rounded-xl text-stone-400 hover:text-red-600"
                          aria-label="Delete expense"
                          onClick={() => setDeletingExpense(item.id)}
                        >
                          <Trash2 className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(
          [
            ['Expense', 'expense'],
            ['Income', 'income'],
            ['Investment', 'investment'],
            ['Withdrawal', 'withdrawal'],
            ['Loan pay', 'loan-payment'],
          ] as const
        ).map(([label, key]) => (
          <button
            key={key}
            className="min-h-11 rounded-2xl bg-teal-700 px-3 text-sm font-semibold text-white"
            onClick={() => setSheet(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Wealth goals</h2>
          <Link to="/wealth" className="text-sm font-medium text-teal-700">
            See all
          </Link>
        </div>
        {counts.goals === 0 ? (
          <EmptyState
            title="Build your first wealth goal"
            body="Create a goal like Retirement, Emergency Fund or Child Education."
            action={
              <Link to="/wealth" className="text-sm font-semibold text-teal-700">
                Create goal
              </Link>
            }
          />
        ) : (
          finance.goals.slice(0, 3).map((goal) => {
            const metrics = calculateGoalMetrics(goal, finance.assets, asOf)
            return (
              <Link key={goal.id} to={`/wealth/${goal.id}`}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>
                      <p className="mt-1 text-sm text-stone-500">
                        {formatMoney(metrics.currentValue, currency, { compact: true })} /{' '}
                        {formatMoney(metrics.targetAmount, currency, { compact: true })}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-stone-500">
                      {metrics.trackStatus}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Progress value={metrics.displayProgressPercent} />
                    <p className="mt-2 text-xs text-stone-500">
                      {formatPercent(metrics.displayProgressPercent)} · Monthly plan{' '}
                      {formatMoney(metrics.monthlyPlannedInvestment, currency, {
                        compact: true,
                      })}
                    </p>
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </section>

      {allocation.length > 0 ? (
        <ChartCard
          title="Asset allocation"
          subtitle="Where your current wealth is invested"
        >
          <AllocationList
            data={allocation}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      ) : null}

      {wealthGrowth.length > 0 ? (
        <ChartCard
          title="Wealth growth projection"
          subtitle="Projected wealth vs target path — estimates only"
        >
          <WealthGrowthChart
            data={wealthGrowth}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      ) : null}

      {goalBars.length > 0 ? (
        <ChartCard title="Goal progress" subtitle="Current value vs target">
          <GoalProgressBars
            items={goalBars}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      ) : null}

      {emiByLoan.length > 0 ? (
        <ChartCard title="Loan burden" subtitle="Monthly EMI share by loan">
          <DonutChart
            data={emiByLoan}
            centerLabel="Total EMI"
            centerValue={formatMoney(emi, currency, { compact: true })}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Loans</h2>
          <Link to="/loans" className="text-sm font-medium text-teal-700">
            See all
          </Link>
        </div>
        {counts.loans === 0 ? (
          <EmptyState
            title="No loans tracked"
            body="Add a loan to understand your monthly debt burden."
          />
        ) : (
          finance.loans.slice(0, 2).map((loan) => {
            const metrics = calculateLoanMetrics(loan, asOf)
            return (
              <Link key={loan.id} to={`/loans/${loan.id}`}>
                <Card>
                  <h3 className="font-semibold">{loan.name}</h3>
                  <p className="mt-1 text-sm text-stone-500">
                    {formatMoney(metrics.outstandingAmount, currency, { compact: true })}{' '}
                    left to pay
                  </p>
                  <div className="mt-3">
                    <Progress value={metrics.progressPercent} />
                    <p className="mt-2 text-xs text-stone-500">
                      EMI {formatMoney(metrics.emiAmount, currency, { compact: true })} ·{' '}
                      {formatPercent(metrics.progressPercent)} paid
                    </p>
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </section>

      <Card>
        <h2 className="font-semibold">Financial health</h2>
        <p className="mt-1 text-sm text-stone-500">
          Simple checks from this month’s numbers — not advice.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex justify-between">
            <span>Savings rate</span>
            <span>
              {formatPercent(health.savingsRate)} · {health.savingsLabel}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Investment rate</span>
            <span>
              {formatPercent(health.investmentRate)} · {health.investmentLabel}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Debt-to-income</span>
            <span>
              {formatPercent(health.debtToIncome)} · {health.debtLabel}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Loan burden</span>
            <span>{formatPercent(loanBurdenRatio(emi, cashflow.income))}</span>
          </li>
          <li className="flex justify-between font-semibold">
            <span>Overall</span>
            <span>{health.overallLabel}</span>
          </li>
        </ul>
      </Card>

      <ConfirmBar
        open={deletingExpense !== null}
        title="Delete expense?"
        body="This will remove the expense from your monthly cash flow."
        onCancel={() => setDeletingExpense(null)}
        onConfirm={() => {
          if (!deletingExpense) return
          void finance
            .removeExpense(deletingExpense)
            .then(() => {
              toast.success('Expense deleted')
              setDeletingExpense(null)
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : 'Could not delete')
            })
        }}
      />

      <ConfirmBar
        open={deletingIncome !== null}
        title="Delete income?"
        body="This will remove the income from your monthly cash flow."
        onCancel={() => setDeletingIncome(null)}
        onConfirm={() => {
          if (!deletingIncome) return
          void finance
            .removeIncome(deletingIncome)
            .then(() => {
              toast.success('Income deleted')
              setDeletingIncome(null)
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : 'Could not delete')
            })
        }}
      />

      <QuickSheets open={sheet} onOpenChange={setSheet} />
    </div>
  )
}
