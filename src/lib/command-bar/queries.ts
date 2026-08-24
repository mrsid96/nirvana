import { calculateGoalMetrics } from '@/lib/calculations/goals'
import { formatMoney } from '@/lib/formatters/currency'
import { formatMonthLabel } from '@/lib/formatters/dates'
import type { CommandIntent, FinanceSnapshot, QueryResult, StructuredIntent } from '@/lib/command-bar/types'
import type { SupportedCurrency } from '@/types/user'
import type { Goal } from '@/types/goal'
import type { Asset } from '@/types/asset'

export function resolveQuery(
  intent: CommandIntent,
  snapshot: FinanceSnapshot,
  structured: StructuredIntent,
  currency: SupportedCurrency,
  asOf: string,
  goals: Goal[],
  assets: Asset[],
): QueryResult | undefined {
  const monthLabel = formatMonthLabel(snapshot.currentMonth)

  switch (intent) {
    case 'QUERY_MONTHLY_SPENDING':
      return {
        title: `${monthLabel} spending`,
        value: formatMoney(snapshot.cashFlow.expenses, currency),
        subtitle: `${snapshot.expenses.filter((e) => e.month === snapshot.currentMonth).length} expenses`,
      }

    case 'QUERY_MONTHLY_INVESTMENT':
      return {
        title: `${monthLabel} investments`,
        value: formatMoney(snapshot.cashFlow.investments, currency),
        subtitle: `${snapshot.transactions.filter((t) => t.month === snapshot.currentMonth && t.type === 'INVESTMENT').length} investments`,
      }

    case 'QUERY_NET_WORTH':
      return {
        title: 'Net worth',
        value: formatMoney(snapshot.netWorth, currency),
      }

    case 'QUERY_CASH_FLOW':
      return {
        title: `${monthLabel} free cash flow`,
        value: formatMoney(snapshot.cashFlow.freeCashFlow, currency),
        subtitle: `Income ${formatMoney(snapshot.cashFlow.income, currency)} · Spending ${formatMoney(snapshot.cashFlow.expenses, currency)}`,
      }

    case 'QUERY_LOAN_OUTSTANDING': {
      const loanId = structured.loanId
      const loan = loanId
        ? snapshot.loans.find((l) => l.id === loanId)
        : snapshot.loans[0]
      if (!loan) return { title: 'Loan outstanding', value: 'No loans found' }
      return {
        title: loan.name,
        value: formatMoney(loan.outstandingAmount, currency),
        subtitle: 'Outstanding balance',
      }
    }

    case 'QUERY_GOAL_PROGRESS': {
      const goalId = structured.goalId
      const goal = goalId ? goals.find((g) => g.id === goalId) : goals[0]
      if (!goal) return { title: 'Goal progress', value: 'No goals found' }
      const metrics = calculateGoalMetrics(goal, assets, asOf)
      return {
        title: goal.name,
        value: `${metrics.displayProgressPercent.toFixed(0)}%`,
        subtitle: `${formatMoney(metrics.currentValue, currency)} of ${formatMoney(goal.targetAmount, currency)}`,
      }
    }

    default:
      return undefined
  }
}
