import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  Card,
  ConfirmBar,
  EmptyState,
  Field,
  Input,
  Progress,
  Sheet,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import {
  calculateLoanMetrics,
  totalMonthlyEmi,
  totalOriginal,
  totalOutstanding,
  totalPaid,
} from '@/lib/calculations/loans'
import { todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney, formatPercent } from '@/lib/formatters/currency'
import { toMinorUnits } from '@/lib/money'
import type { Loan } from '@/types/loan'
import { ChartCard, DonutChart } from '@/components/charts'

export function LoansPage() {
  const { profile } = useAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const asOf = todayIsoDate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [original, setOriginal] = useState('')
  const [outstanding, setOutstanding] = useState('')
  const [emi, setEmi] = useState('')
  const [rate, setRate] = useState('8')
  const [tenure, setTenure] = useState('240')
  const [emiDate, setEmiDate] = useState('5')
  const [startDate, setStartDate] = useState(asOf)
  const [busy, setBusy] = useState(false)

  const outstandingByLoan = useMemo(
    () =>
      finance.loans
        .filter((loan) => !loan.isDeleted)
        .map((loan) => ({ name: loan.name, value: loan.outstandingAmount })),
    [finance.loans],
  )

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await finance.addLoan({
        name,
        bank,
        originalAmount: toMinorUnits(Number(original), currency),
        outstandingAmount: toMinorUnits(Number(outstanding || original), currency),
        interestRate: Number(rate),
        tenureMonths: Number(tenure),
        startDate,
        emiAmount: toMinorUnits(Number(emi), currency),
        emiDate: Number(emiDate),
        deductionBank: bank,
        status: 'ACTIVE',
      })
      toast.success('Loan added')
      setOpen(false)
      setName('')
      setBank('')
      setOriginal('')
      setOutstanding('')
      setEmi('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Loans</h1>
          <p className="mt-1 text-sm text-stone-500">
            What you still owe, and what leaves every month.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Add loan</Button>
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-stone-500">Left to pay</dt>
            <dd className="text-xl font-semibold">
              {formatMoney(totalOutstanding(finance.loans), currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Paid so far</dt>
            <dd className="text-xl font-semibold">
              {formatMoney(totalPaid(finance.loans), currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Original</dt>
            <dd className="font-semibold">
              {formatMoney(totalOriginal(finance.loans), currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Monthly EMI</dt>
            <dd className="font-semibold">
              {formatMoney(totalMonthlyEmi(finance.loans), currency, { compact: true })}
            </dd>
          </div>
        </dl>
      </Card>

      {outstandingByLoan.length > 0 ? (
        <ChartCard
          title="Outstanding balance by loan"
          subtitle="Current share of total debt"
        >
          <DonutChart
            data={outstandingByLoan}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      ) : null}

      {finance.loans.length === 0 ? (
        <EmptyState
          title="No loans tracked"
          body="Add your first loan to understand your monthly debt burden."
          action={<Button onClick={() => setOpen(true)}>Add loan</Button>}
        />
      ) : (
        finance.loans.map((loan) => {
          const metrics = calculateLoanMetrics(loan, asOf)
          return (
            <Link key={loan.id} to={`/loans/${loan.id}`}>
              <Card>
                <h2 className="font-semibold">{loan.name}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {formatMoney(metrics.outstandingAmount, currency, { compact: true })}{' '}
                  outstanding
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

      <Sheet open={open} onOpenChange={setOpen} title="Add loan">
        <LoanForm
          onSave={onCreate}
          busy={busy}
          state={{
            name,
            setName,
            bank,
            setBank,
            original,
            setOriginal,
            outstanding,
            setOutstanding,
            emi,
            setEmi,
            rate,
            setRate,
            tenure,
            setTenure,
            emiDate,
            setEmiDate,
            startDate,
            setStartDate,
          }}
        />
      </Sheet>
    </div>
  )
}

export function LoanDetailPage() {
  const { loanId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const loan = finance.loans.find((item) => item.id === loanId)
  const metrics = loan ? calculateLoanMetrics(loan, todayIsoDate()) : null
  const payments = useMemo(
    () =>
      finance.loanPayments
        .filter((item) => item.loanId === loanId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [finance.loanPayments, loanId],
  )
  const [confirm, setConfirm] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(loan?.name ?? '')
  const [bank, setBank] = useState(loan?.bank ?? '')
  const [original, setOriginal] = useState('')
  const [outstanding, setOutstanding] = useState('')
  const [emi, setEmi] = useState('')
  const [rate, setRate] = useState('')
  const [tenure, setTenure] = useState('')
  const [emiDate, setEmiDate] = useState('')
  const [startDate, setStartDate] = useState(loan?.startDate ?? todayIsoDate())
  const [busy, setBusy] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(todayIsoDate())
  const [payNote, setPayNote] = useState('')

  const outstandingShare = useMemo(() => {
    if (!loan) return 0
    const total = finance.loans.reduce((sum, item) => sum + item.outstandingAmount, 0)
    return total > 0 ? (loan.outstandingAmount / total) * 100 : 0
  }, [finance.loans, loan])

  if (!loan || !metrics) {
    return <EmptyState title="Loan not found" body="It may have been removed." />
  }
  const currentLoan: Loan = loan

  function openEdit() {
    setName(currentLoan.name)
    setBank(currentLoan.bank)
    setOriginal(String(currentLoan.originalAmount / 100))
    setOutstanding(String(currentLoan.outstandingAmount / 100))
    setEmi(String(currentLoan.emiAmount / 100))
    setRate(String(currentLoan.interestRate))
    setTenure(String(currentLoan.tenureMonths))
    setEmiDate(String(currentLoan.emiDate))
    setStartDate(currentLoan.startDate)
    setEditOpen(true)
  }

  async function onEdit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await finance.editLoan(currentLoan.id, {
        name,
        bank,
        originalAmount: toMinorUnits(Number(original), currency),
        outstandingAmount: toMinorUnits(Number(outstanding || original), currency),
        interestRate: Number(rate),
        tenureMonths: Number(tenure),
        startDate,
        emiAmount: toMinorUnits(Number(emi), currency),
        emiDate: Number(emiDate),
        deductionBank: bank,
      })
      toast.success('Loan updated')
      setEditOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function onPay(event: FormEvent) {
    event.preventDefault()
    const minor = toMinorUnits(Number(payAmount), currency)
    if (!Number.isFinite(minor) || minor <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setBusy(true)
    try {
      await finance.addLoanPayment(
        {
          loanId: currentLoan.id,
          amount: minor,
          date: payDate,
          note: payNote || undefined,
        },
        true,
      )
      toast.success('Loan payment recorded')
      setPayOpen(false)
      setPayAmount('')
      setPayNote('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/loans" className="text-sm font-medium text-teal-700">
        Back to loans
      </Link>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{loan.name}</h1>
          <p className="mt-1 text-stone-500">{loan.bank}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openEdit}>
            Edit
          </Button>
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            Delete
          </Button>
        </div>
      </header>
      <Card>
        <p className="text-sm text-stone-500">Left to pay</p>
        <p className="mt-1 text-3xl font-semibold">
          {formatMoney(metrics.outstandingAmount, currency, { compact: true })}
        </p>
        <div className="mt-3">
          <Progress value={metrics.progressPercent} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-stone-500">Original</dt>
            <dd className="font-semibold">
              {formatMoney(metrics.originalAmount, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Paid</dt>
            <dd className="font-semibold">
              {formatMoney(metrics.paidAmount, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">EMI</dt>
            <dd className="font-semibold">
              {formatMoney(metrics.emiAmount, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Interest</dt>
            <dd className="font-semibold">{formatPercent(loan.interestRate)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">EMI date</dt>
            <dd className="font-semibold">{loan.emiDate}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Months left</dt>
            <dd className="font-semibold">{metrics.remainingMonths}</dd>
          </div>
        </dl>

        {finance.loans.length > 0 ? (
          <p className="mt-4 text-xs text-stone-500">
            {outstandingShare >= 0 ? `${outstandingShare.toFixed(1)}%` : '0%'} of total
            debt
          </p>
        ) : null}
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Payments</h2>
          <Button onClick={() => setPayOpen(true)}>Record payment</Button>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-stone-500">
            No payments recorded yet. Use Loan pay on Home or record here.
          </p>
        ) : (
          payments.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-stone-500">{item.date}</span>
              <span className="font-medium">
                {formatMoney(item.amount, currency, { compact: true })}
              </span>
            </div>
          ))
        )}
      </section>

      <ConfirmBar
        open={confirm}
        title={`Delete ${loan.name}?`}
        body="This will hide the loan and its payment history from your dashboard."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          void finance.removeLoan(loan.id).then(() => navigate('/loans'))
        }}
      />

      <Sheet open={editOpen} onOpenChange={setEditOpen} title="Edit loan">
        <form className="space-y-4" onSubmit={onEdit}>
          <LoanFormFields
            state={{
              name,
              setName,
              bank,
              setBank,
              original,
              setOriginal,
              outstanding,
              setOutstanding,
              emi,
              setEmi,
              rate,
              setRate,
              tenure,
              setTenure,
              emiDate,
              setEmiDate,
              startDate,
              setStartDate,
            }}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Sheet>

      <Sheet open={payOpen} onOpenChange={setPayOpen} title="Record loan payment">
        <form className="space-y-4" onSubmit={onPay}>
          <Field label="Amount">
            <Input
              inputMode="decimal"
              value={payAmount}
              onChange={(event) => setPayAmount(event.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={payDate}
              onChange={(event) => setPayDate(event.target.value)}
              required
            />
          </Field>
          <Field label="Note">
            <Input
              value={payNote}
              onChange={(event) => setPayNote(event.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Record payment'}
          </Button>
        </form>
      </Sheet>
    </div>
  )
}

interface LoanFormState {
  name: string
  setName: (value: string) => void
  bank: string
  setBank: (value: string) => void
  original: string
  setOriginal: (value: string) => void
  outstanding: string
  setOutstanding: (value: string) => void
  emi: string
  setEmi: (value: string) => void
  rate: string
  setRate: (value: string) => void
  tenure: string
  setTenure: (value: string) => void
  emiDate: string
  setEmiDate: (value: string) => void
  startDate: string
  setStartDate: (value: string) => void
}

function LoanFormFields({ state }: { state: LoanFormState }) {
  return (
    <>
      <Field label="Name">
        <Input
          value={state.name}
          onChange={(event) => state.setName(event.target.value)}
          required
        />
      </Field>
      <Field label="Bank">
        <Input
          value={state.bank}
          onChange={(event) => state.setBank(event.target.value)}
          required
        />
      </Field>
      <Field label="Original amount">
        <Input
          inputMode="decimal"
          value={state.original}
          onChange={(event) => state.setOriginal(event.target.value)}
          required
        />
      </Field>
      <Field label="Left to pay">
        <Input
          inputMode="decimal"
          value={state.outstanding}
          onChange={(event) => state.setOutstanding(event.target.value)}
        />
      </Field>
      <Field label="EMI">
        <Input
          inputMode="decimal"
          value={state.emi}
          onChange={(event) => state.setEmi(event.target.value)}
          required
        />
      </Field>
      <Field label="Interest rate %">
        <Input
          inputMode="decimal"
          value={state.rate}
          onChange={(event) => state.setRate(event.target.value)}
        />
      </Field>
      <Field label="Tenure (months)">
        <Input
          inputMode="numeric"
          value={state.tenure}
          onChange={(event) => state.setTenure(event.target.value)}
        />
      </Field>
      <Field label="EMI date">
        <Input
          inputMode="numeric"
          value={state.emiDate}
          onChange={(event) => state.setEmiDate(event.target.value)}
        />
      </Field>
      <Field label="Start date">
        <Input
          type="date"
          value={state.startDate}
          onChange={(event) => state.setStartDate(event.target.value)}
        />
      </Field>
    </>
  )
}

function LoanForm({
  onSave,
  busy,
  state,
}: {
  onSave: (event: FormEvent) => void
  busy: boolean
  state: LoanFormState
}) {
  return (
    <form className="space-y-4" onSubmit={onSave}>
      <LoanFormFields state={state} />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Saving…' : 'Save loan'}
      </Button>
    </form>
  )
}
