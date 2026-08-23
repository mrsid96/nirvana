import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Field, Input, Select, Sheet } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import { todayIsoDate } from '@/lib/formatters/dates'
import { toMinorUnits } from '@/lib/money'
import { EXPENSE_CATEGORIES, PAYMENT_SOURCES } from '@/types/expense'
import { INCOME_SOURCES } from '@/types/income'

export type QuickSheet =
  | 'expense'
  | 'income'
  | 'investment'
  | 'withdrawal'
  | 'loan-payment'
  | null

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

  const title = useMemo(() => {
    if (open === 'expense') return 'Add expense'
    if (open === 'income') return 'Add income'
    if (open === 'investment') return 'Record investment'
    if (open === 'withdrawal') return 'Record withdrawal'
    if (open === 'loan-payment') return 'Record loan payment'
    return ''
  }, [open])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
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
        toast.success('Expense added')
      } else if (open === 'income') {
        await finance.addIncome({
          amount: minor,
          source: incomeSource,
          date,
          description: note || undefined,
        })
        toast.success('Income added')
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
        toast.success(open === 'investment' ? 'Investment recorded' : 'Withdrawal recorded')
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
        toast.success('Loan payment recorded')
      }
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
    <Sheet open={open !== null} onOpenChange={(next) => onOpenChange(next ? open : null)} title={title}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Amount">
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            autoFocus
            required
          />
        </Field>
        {open === 'expense' ? (
          <>
            <Field label="Category">
              <Select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
                {EXPENSE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
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
        <Field label="Date">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>
        <Field label="Note">
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Sheet>
  )
}
