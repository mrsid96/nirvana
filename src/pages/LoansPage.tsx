import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSetPageTitle } from '@/contexts/PageTitleContext'
import { ActivityTimeline, type TimelineItem } from '@/components/ActivityTimeline'
import { CommandBar } from '@/components/CommandBar'
import { SegmentedControl } from '@/components/SegmentedControl'
import {
  Button,
  Card,
  ConfirmBar,
  EmptyState,
  Field,
  HeroCard,
  Input,
  Progress,
  SectionTitle,
  Textarea,
} from '@/components/ui'
import { FormPanel } from '@/components/FormPanel'
import { LoanCard } from '@/components/LoanCard'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import {
  calculateLoanMetrics,
  totalMonthlyEmi,
  totalOutstanding,
  totalPaid,
} from '@/lib/calculations/loans'
import { todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney, formatPercent } from '@/lib/formatters/currency'
import {
  parseAmountInput,
  parseDayOfMonth,
  parsePositiveInteger,
  parseRatePercent,
} from '@/lib/validation/parse'
import type { Loan } from '@/types/loan'
import { ChartCard, DonutChart } from '@/components/charts'

type LoansTab = 'loans' | 'activity'

export function LoansPage() {
  const { profile } = useAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const asOf = todayIsoDate()
  const [tab, setTab] = useState<LoansTab>('loans')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [purpose, setPurpose] = useState('')
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

  const totalDebt = totalOutstanding(finance.loans)
  const totalPaidAmount = totalPaid(finance.loans)
  const monthlyEmi = totalMonthlyEmi(finance.loans)

  const activityItems = useMemo((): TimelineItem[] => {
    return finance.loanPayments
      .filter((payment) => !payment.isDeleted)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
      .map((payment) => {
        const loan = finance.loans.find((item) => item.id === payment.loanId)
        return {
          id: payment.id,
          date: payment.date,
          title: 'Loan payment',
          subtitle: [loan?.name, payment.note].filter(Boolean).join(' · '),
          amount: payment.amount,
          type: 'loan-payment',
        }
      })
  }, [finance.loanPayments, finance.loans])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Enter a loan name')
      return
    }
    const originalParsed = parseAmountInput(original, currency)
    if (!originalParsed.ok) {
      toast.error(originalParsed.message)
      return
    }
    const outstandingParsed = parseAmountInput(outstanding || original, currency, { allowZero: true })
    if (!outstandingParsed.ok) {
      toast.error(outstandingParsed.message)
      return
    }
    const emiParsed = parseAmountInput(emi, currency)
    if (!emiParsed.ok) {
      toast.error(emiParsed.message)
      return
    }
    const rateParsed = parseRatePercent(rate)
    if (!rateParsed.ok) {
      toast.error(rateParsed.message)
      return
    }
    const tenureParsed = parsePositiveInteger(tenure, 'Tenure (months)', 600)
    if (!tenureParsed.ok) {
      toast.error(tenureParsed.message)
      return
    }
    const emiDayParsed = parseDayOfMonth(emiDate)
    if (!emiDayParsed.ok) {
      toast.error(emiDayParsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.addLoan({
        name,
        description: description.trim() || undefined,
        purpose: purpose.trim() || undefined,
        bank,
        originalAmount: originalParsed.minor,
        outstandingAmount: outstandingParsed.minor,
        interestRate: rateParsed.rate,
        tenureMonths: tenureParsed.value,
        startDate,
        emiAmount: emiParsed.minor,
        emiDate: emiDayParsed.day,
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
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink dark:text-white lg:text-3xl">
            Your loans
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Let&apos;s keep the debt journey visible.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add loan</span>
        </Button>
      </header>

      <CommandBar contextKey="loans" />

      <section
        className={
          outstandingByLoan.length > 0
            ? 'grid gap-4 lg:grid-cols-2 lg:items-stretch'
            : 'space-y-4'
        }
      >
        <HeroCard gradient="violet" className="flex flex-col justify-between lg:h-[200px] lg:py-4">
          <p className="text-sm font-medium text-white/80">Total remaining</p>
          <p className="font-display mt-0.5 text-[32px] font-semibold leading-none tracking-tight lg:text-[36px]">
            {formatMoney(totalDebt, currency, { compact: true })}
          </p>
          <p className="mt-1.5 text-sm text-white/75">
            {formatMoney(totalPaidAmount, currency, { compact: true })} paid so far
          </p>
          <div className="mt-3 rounded-[14px] bg-white/12 px-3 py-2 backdrop-blur-sm">
            <p className="text-xs text-white/70">Monthly EMI</p>
            <p className="font-display mt-0.5 text-sm font-semibold lg:text-base">
              {formatMoney(monthlyEmi, currency, { compact: true })}
            </p>
          </div>
        </HeroCard>

        {outstandingByLoan.length > 0 ? (
          <ChartCard className="flex flex-col justify-center rounded-[24px] py-3 lg:h-[200px]">
            <DonutChart
              compact
              data={outstandingByLoan}
              centerLabel="Total debt"
              centerValue={formatMoney(totalDebt, currency, { compact: true })}
              formatValue={(value) => formatMoney(value, currency, { compact: true })}
            />
          </ChartCard>
        ) : null}
      </section>

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'loans', label: 'Loans' },
          { value: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'loans' ? (
        finance.loans.length === 0 ? (
          <EmptyState
            title="No loans tracked"
            body="Nothing here yet. Add a loan when you're ready."
            action={<Button onClick={() => setOpen(true)}>Add loan</Button>}
          />
        ) : (
          <div className="space-y-3">
            {finance.loans.map((loan) => {
              const metrics = calculateLoanMetrics(loan, asOf)
              return (
                <LoanCard
                  key={loan.id}
                  loanId={loan.id}
                  name={loan.name}
                  outstanding={metrics.outstandingAmount}
                  progress={metrics.progressPercent}
                  emi={metrics.emiAmount}
                  rate={loan.interestRate}
                  monthsRemaining={metrics.remainingMonths}
                  currency={currency}
                  variant="calm"
                />
              )
            })}
          </div>
        )
      ) : null}

      {tab === 'activity' ? (
        <section className="space-y-3">
          <SectionTitle title="Recent payments" subtitle="EMIs and extra payments across loans" />
          <Card variant="flat">
            <ActivityTimeline
              items={activityItems}
              currency={currency}
              emptyMessage="No payments recorded yet. Record a payment from a loan detail page."
            />
          </Card>
        </section>
      ) : null}

      <FormPanel open={open} onOpenChange={setOpen} title="Add loan">
        <LoanForm
          onSave={onCreate}
          busy={busy}
          state={{
            name,
            setName,
            description,
            setDescription,
            purpose,
            setPurpose,
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
      </FormPanel>
    </div>
  )
}

export function LoanDetailPage() {
  const { loanId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const finance = useFinance()
  const { ensureLoanDetail } = finance
  const currency = profile?.currency ?? 'INR'
  const loan = finance.loans.find((item) => item.id === loanId)
  const metrics = loan ? calculateLoanMetrics(loan, todayIsoDate()) : null
  useSetPageTitle(loan?.name ?? null)

  useEffect(() => {
    if (loanId) void ensureLoanDetail(loanId)
  }, [ensureLoanDetail, loanId, finance.loading])
  const payments = useMemo(
    () =>
      finance.loanPayments
        .filter((item) => item.loanId === loanId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [finance.loanPayments, loanId],
  )

  const paymentItems = useMemo((): TimelineItem[] => {
    return payments.map((payment) => ({
      id: payment.id,
      date: payment.date,
      title: payment.amount === loan?.emiAmount ? 'EMI payment' : 'Extra payment',
      subtitle: payment.note || loan?.bank,
      amount: payment.amount,
      type: 'loan-payment',
    }))
  }, [payments, loan?.bank, loan?.emiAmount])

  const [confirm, setConfirm] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(loan?.name ?? '')
  const [description, setDescription] = useState(loan?.description ?? '')
  const [purpose, setPurpose] = useState(loan?.purpose ?? '')
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
    setDescription(currentLoan.description ?? '')
    setPurpose(currentLoan.purpose ?? '')
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
    if (!name.trim()) {
      toast.error('Enter a loan name')
      return
    }
    const originalParsed = parseAmountInput(original, currency)
    if (!originalParsed.ok) {
      toast.error(originalParsed.message)
      return
    }
    const outstandingParsed = parseAmountInput(outstanding || original, currency, { allowZero: true })
    if (!outstandingParsed.ok) {
      toast.error(outstandingParsed.message)
      return
    }
    const emiParsed = parseAmountInput(emi, currency)
    if (!emiParsed.ok) {
      toast.error(emiParsed.message)
      return
    }
    const rateParsed = parseRatePercent(rate)
    if (!rateParsed.ok) {
      toast.error(rateParsed.message)
      return
    }
    const tenureParsed = parsePositiveInteger(tenure, 'Tenure (months)', 600)
    if (!tenureParsed.ok) {
      toast.error(tenureParsed.message)
      return
    }
    const emiDayParsed = parseDayOfMonth(emiDate)
    if (!emiDayParsed.ok) {
      toast.error(emiDayParsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.editLoan(currentLoan.id, {
        name,
        description: description.trim() || undefined,
        purpose: purpose.trim() || undefined,
        bank,
        originalAmount: originalParsed.minor,
        outstandingAmount: outstandingParsed.minor,
        interestRate: rateParsed.rate,
        tenureMonths: tenureParsed.value,
        startDate,
        emiAmount: emiParsed.minor,
        emiDate: emiDayParsed.day,
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
    const parsed = parseAmountInput(payAmount, currency)
    if (!parsed.ok) {
      toast.error(parsed.message)
      return
    }
    const minor = parsed.minor
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
    <div className="space-y-4 lg:space-y-5">
      <Link to="/loans" className="hidden text-sm font-medium text-accent lg:inline">
        Back to loans
      </Link>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="hidden text-3xl font-semibold tracking-tight lg:block">{loan.name}</h1>
          <p className="text-sm text-stone-500 lg:mt-1">{loan.bank}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={openEdit}>
            Edit
          </Button>
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            Delete
          </Button>
        </div>
      </header>

      <CommandBar contextKey="loan" loanId={loanId} />

      <Card>
        <p className="text-sm text-ink-muted">Remaining</p>
        <p className="font-display mt-1 text-3xl font-semibold text-ink dark:text-white">
          {formatMoney(metrics.outstandingAmount, currency, { compact: true })}
        </p>
        <p className="mt-1 text-sm text-success">
          {formatMoney(metrics.paidAmount, currency, { compact: true })} paid — you&apos;re reducing the debt
        </p>
        <div className="mt-4">
          <Progress value={metrics.progressPercent} color="#6657E8" />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-ink-muted">Original</dt>
            <dd className="font-semibold text-ink dark:text-white">
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-white">Payments</h2>
            <p className="text-sm text-ink-muted">
              {payments.length === 0
                ? 'No payments recorded yet'
                : `${payments.length} payment${payments.length === 1 ? '' : 's'} · ${formatMoney(
                    metrics.paidAmount,
                    currency,
                    { compact: true },
                  )} total`}
            </p>
          </div>
          <Button onClick={() => setPayOpen(true)} className="shrink-0">
            Record payment
          </Button>
        </div>
        <Card variant="flat">
          <ActivityTimeline
            items={paymentItems}
            currency={currency}
            emptyMessage="No payments recorded yet. Record your first EMI or extra payment."
          />
        </Card>
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

      <FormPanel open={editOpen} onOpenChange={setEditOpen} title="Edit loan">
        <form className="space-y-4" onSubmit={onEdit}>
          <LoanFormFields
            state={{
              name,
              setName,
              description,
              setDescription,
              purpose,
              setPurpose,
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
      </FormPanel>

      <FormPanel open={payOpen} onOpenChange={setPayOpen} title="Record loan payment" wide>
        <form className="space-y-4" onSubmit={onPay}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Amount">
              <Input
                inputMode="decimal"
                value={payAmount}
                onChange={(event) => setPayAmount(event.target.value)}
                required
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
            <Field label="Note" className="lg:col-span-2">
              <Input
                value={payNote}
                onChange={(event) => setPayNote(event.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Record payment'}
          </Button>
        </form>
      </FormPanel>
    </div>
  )
}

interface LoanFormState {
  name: string
  setName: (value: string) => void
  description: string
  setDescription: (value: string) => void
  purpose: string
  setPurpose: (value: string) => void
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
      <Field label="Description" hint="Optional">
        <Textarea
          value={state.description}
          onChange={(event) => state.setDescription(event.target.value)}
          rows={2}
          placeholder="Notes about this loan"
        />
      </Field>
      <Field label="Purpose" hint="Optional">
        <Input
          value={state.purpose}
          onChange={(event) => state.setPurpose(event.target.value)}
          placeholder="Home, car, education…"
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
