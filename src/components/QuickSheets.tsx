import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { AmountInput, Button, Field, FullPageOverlay, Input, Pill, Select } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import { todayIsoDate } from '@/lib/formatters/dates'
import { toMinorUnits } from '@/lib/money'
import {
  getQuickSheetSuccessMessage,
  getQuickSheetTitle,
  type QuickSheet,
} from '@/lib/quick-actions'
import { EXPENSE_CATEGORIES, PAYMENT_SOURCES } from '@/types/expense'
import { INCOME_SOURCES } from '@/types/income'

export type { QuickSheet } from '@/lib/quick-actions'

const QUICK_EXPENSE_CATEGORIES = ['Food', 'Groceries', 'Transport', 'Home', 'Shopping', 'Travel'] as const

const categoryEmoji: Record<string, string> = {
  Food: '🍔',
  Groceries: '🛒',
  Transport: '🚗',
  Home: '🏠',
  Shopping: '🛍',
  Travel: '✈️',
  Entertainment: '🎬',
  Health: '💊',
  Education: '📚',
}

export function QuickSheets({
  open,
  onOpenChange,
}: {
  open: QuickSheet
  onOpenChange: (value: QuickSheet) => void
}) {
  const { profile } = useAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayIsoDate())
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>('Food')
  const [paymentSource, setPaymentSource] = useState<(typeof PAYMENT_SOURCES)[number]>('UPI')
  const [incomeSource, setIncomeSource] = useState('Salary')
  const [assetId, setAssetId] = useState(finance.assets[0]?.id ?? '')
  const [loanId, setLoanId] = useState(finance.loans[0]?.id ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount('')
      setNote('')
      setDate(todayIsoDate())
    }
  }, [open])

  const title = open ? getQuickSheetTitle(open) : ''
  const successMessage = open ? getQuickSheetSuccessMessage(open) : 'Saved.'

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!open) return
    const minor = toMinorUnits(Number(amount), currency)
    if (!Number.isFinite(minor) || minor <= 0) {
      toast.error('Enter a valid amount')
      return
    }
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
        const asset = finance.assets.find((item) => item.id === assetId)
        if (!asset) {
          toast.error('Choose an asset first')
          return
        }
        await finance.addTransaction(
          {
            assetId: asset.id,
            goalId: asset.goalId,
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
    <FullPageOverlay
      open={open !== null}
      onClose={() => onOpenChange(null)}
      title={title}
    >
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
              {QUICK_EXPENSE_CATEGORIES.map((item) => (
                <Pill
                  key={item}
                  active={category === item}
                  onClick={() => setCategory(item)}
                  className="!px-3"
                >
                  {categoryEmoji[item] ?? ''} {item}
                </Pill>
              ))}
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
          <Field label="Asset">
            <Select value={assetId} onChange={(event) => setAssetId(event.target.value)}>
              {finance.assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </Select>
          </Field>
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
    </FullPageOverlay>
  )
}
