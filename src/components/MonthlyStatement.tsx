import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, ConfirmBar, SectionTitle } from '@/components/ui'
import { MoneyFlow, SummaryGrid } from '@/components/MoneyFlow'
import { useFinance } from '@/contexts/FinanceContext'
import { calculateMonthlyCashFlow } from '@/lib/calculations/cashflow'
import { formatDisplayDate, formatMonthLabel, monthKeyFromDate, shiftMonth } from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import type { SupportedCurrency } from '@/types/user'

export function MonthlyStatement({
  month,
  onMonthChange,
  currency,
}: {
  month: string
  onMonthChange: (month: string) => void
  currency: SupportedCurrency
}) {
  const finance = useFinance()
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)
  const [deletingIncome, setDeletingIncome] = useState<string | null>(null)

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
      <div className="flex items-center justify-between gap-3">
        <SectionTitle title="Cash flow" />
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full text-ink-muted active:bg-ink/5 dark:active:bg-white/5"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[7rem] text-center text-sm font-semibold text-ink dark:text-white">
            {formatMonthLabel(month)}
          </span>
          <button
            type="button"
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full text-ink-muted active:bg-ink/5 dark:active:bg-white/5"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <SummaryGrid
        currency={currency}
        items={[
          { label: 'Income', value: cashflow.income, tint: 'mint' },
          { label: 'Spending', value: cashflow.expenses, tint: 'peach' },
          { label: 'Investing', value: cashflow.investments, tint: 'accent' },
          { label: 'Loans', value: cashflow.loanPayments, tint: 'sky' },
        ]}
      />

      <Card variant="flat">
        <MoneyFlow
          income={cashflow.income}
          remaining={cashflow.freeCashFlow}
          currency={currency}
          items={[
            { label: 'Spend', value: cashflow.expenses, color: '#FF9B7A' },
            { label: 'Invest', value: cashflow.investments, color: '#6657E8' },
            { label: 'Loans', value: cashflow.loanPayments, color: '#6BB8E8' },
          ]}
        />
      </Card>

      {(monthIncome.length > 0 || monthExpenses.length > 0) && (
        <section className="space-y-3">
          <SectionTitle title="Entries" subtitle="Income and spending this month" />
          <div className="space-y-2">
            {monthIncome.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-soft)] dark:bg-surface-dark"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-white">{item.source}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDisplayDate(item.date)}
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-success">
                    +{formatMoney(item.amount, currency, { compact: true })}
                  </span>
                  <button
                    type="button"
                    className="min-h-9 min-w-9 rounded-full text-ink-faint active:bg-ink/5"
                    aria-label="Delete income"
                    onClick={() => setDeletingIncome(item.id)}
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {monthExpenses.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-soft)] dark:bg-surface-dark"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-white">{item.category}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDisplayDate(item.date)}
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-ink dark:text-white">
                    {formatMoney(item.amount, currency, { compact: true })}
                  </span>
                  <button
                    type="button"
                    className="min-h-9 min-w-9 rounded-full text-ink-faint active:bg-ink/5"
                    aria-label="Delete expense"
                    onClick={() => setDeletingExpense(item.id)}
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
              toast.success('Expense removed')
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
              toast.success('Income removed')
              setDeletingIncome(null)
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : 'Could not delete')
            })
        }}
      />
    </div>
  )
}
