import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormPanel } from '@/components/FormPanel'
import { AmountInput, Button, Field, Input, Pill, Select } from '@/components/ui'
import { useEffectiveAuth } from '@/contexts/DemoContext'
import { useFinance } from '@/contexts/FinanceContext'
import { todayIsoDate } from '@/lib/formatters/dates'
import { parseAmountInput } from '@/lib/validation/parse'
import {
  getQuickSheetSuccessMessage,
  getQuickSheetTitle,
  type QuickSheet,
} from '@/lib/quick-actions'
import { EXPENSE_CATEGORY_ICONS } from '@/lib/visual-icons'
import { EXPENSE_CATEGORIES, PAYMENT_SOURCES } from '@/types/expense'
import { INCOME_SOURCES } from '@/types/income'

export type { QuickSheet } from '@/lib/quick-actions'

const QUICK_EXPENSE_CATEGORIES = ['Food', 'Groceries', 'Transport', 'Home', 'Shopping', 'Travel'] as const

export function QuickSheets({
  open,
  onOpenChange,
}: {
  open: QuickSheet
  onOpenChange: (value: QuickSheet) => void
}) {
  const { profile } = useEffectiveAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayIsoDate())
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>('Food')
  const [paymentSource, setPaymentSource] = useState<(typeof PAYMENT_SOURCES)[number]>('UPI')
  const [incomeSource, setIncomeSource] = useState('Salary')
  const [goalId, setGoalId] = useState('')
  const [assetId, setAssetId] = useState('')
  const [loanId, setLoanId] = useState(finance.loans[0]?.id ?? '')
  const [busy, setBusy] = useState(false)

  const activeGoals = useMemo(
    () => finance.goals.filter((goal) => !goal.isDeleted),
    [finance.goals],
  )

  const goalAssets = useMemo(
    () => finance.assets.filter((asset) => asset.goalId === goalId && !asset.isDeleted),
    [finance.assets, goalId],
  )

  useEffect(() => {
    if (open) {
      setAmount('')
      setNote('')
      setDate(todayIsoDate())
      const firstGoal = activeGoals[0]?.id ?? ''
      setGoalId(firstGoal)
      const firstAsset = finance.assets.find(
        (asset) => asset.goalId === firstGoal && !asset.isDeleted,
      )
      setAssetId(firstAsset?.id ?? '')
    }
  }, [open, activeGoals, finance.assets])

  const title = open ? getQuickSheetTitle(open) : ''
  const successMessage = open ? getQuickSheetSuccessMessage(open) : 'Saved.'

  function onGoalChange(nextGoalId: string) {
    setGoalId(nextGoalId)
    const firstAsset = finance.assets.find(
      (asset) => asset.goalId === nextGoalId && !asset.isDeleted,
    )
    setAssetId(firstAsset?.id ?? '')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!open) return
    const parsed = parseAmountInput(amount, currency)
    if (!parsed.ok) {
      toast.error(parsed.message)
      return
    }
    const minor = parsed.minor
    setBusy(true)
    try {
      if (open === 'expense') {
        await finance.addExpense({
          amount: minor,
          category,
          date,
          paymentSource,
          description: note || undefined,
        })
      } else if (open === 'income') {
        await finance.addIncome({
          amount: minor,
          source: incomeSource,
          date,
          description: note || undefined,
        })
      } else if (open === 'investment' || open === 'withdrawal') {
        if (!goalId) {
          toast.error('Choose a goal first')
          return
        }
        const asset = goalAssets.find((item) => item.id === assetId)
        if (!asset) {
          toast.error('Choose an asset first')
          return
        }
        await finance.addTransaction(
          {
            assetId: asset.id,
            goalId,
            type: open === 'investment' ? 'INVESTMENT' : 'WITHDRAWAL',
            amount: minor,
            date,
            note: note || undefined,
          },
          asset,
        )
      } else if (open === 'loan-payment') {
        if (!loanId) {
          toast.error('Choose a loan first')
          return
        }
        await finance.addLoanPayment(
          {
            loanId,
            amount: minor,
            date,
            note: note || undefined,
          },
          true,
        )
      }
      toast.success(successMessage)
      onOpenChange(null)
      setAmount('')
      setNote('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormPanel open={open !== null} onOpenChange={(next) => onOpenChange(next ? open : null)} title={title}>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="rounded-[16px] bg-surface px-4 py-5 dark:bg-surface-dark">
          <p className="text-center text-sm font-medium text-ink-muted">How much?</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <span className="font-display text-2xl text-ink-muted">
              {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : ''}
            </span>
            <AmountInput
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              required
            />
          </div>
        </div>

        {open === 'expense' ? (
          <>
            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {QUICK_EXPENSE_CATEGORIES.map((item) => {
                const Icon = EXPENSE_CATEGORY_ICONS[item]
                return (
                  <Pill
                    key={item}
                    active={category === item}
                    onClick={() => setCategory(item)}
                    className="!px-3"
                  >
                    {Icon ? <Icon className="mr-1 inline h-3.5 w-3.5" strokeWidth={2} /> : null}
                    {item}
                  </Pill>
                )
              })}
            </div>
            <Field label="Paid with">
              <Select
                value={paymentSource}
                onChange={(event) => setPaymentSource(event.target.value as typeof paymentSource)}
              >
                {PAYMENT_SOURCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        ) : null}

        {open === 'income' ? (
          <Field label="Source">
            <Select value={incomeSource} onChange={(event) => setIncomeSource(event.target.value)}>
              {INCOME_SOURCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {open === 'investment' || open === 'withdrawal' ? (
          <>
            <Field label="Goal">
              <Select value={goalId} onChange={(event) => onGoalChange(event.target.value)}>
                {activeGoals.length === 0 ? (
                  <option value="">No goals yet</option>
                ) : (
                  activeGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))
                )}
              </Select>
            </Field>
            <Field label="Asset">
              <Select
                value={assetId}
                onChange={(event) => setAssetId(event.target.value)}
                disabled={!goalId || goalAssets.length === 0}
              >
                {goalAssets.length === 0 ? (
                  <option value="">No assets in this goal</option>
                ) : (
                  goalAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))
                )}
              </Select>
            </Field>
          </>
        ) : null}

        {open === 'loan-payment' ? (
          <Field label="Loan">
            <Select value={loanId} onChange={(event) => setLoanId(event.target.value)}>
              {finance.loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field label="What was it?" hint="Optional">
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={open === 'expense' ? 'Groceries, dinner…' : 'Optional note'}
          />
        </Field>

        <Field label="Date">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? 'Saving…' : title}
        </Button>
      </form>
    </FormPanel>
  )
}
