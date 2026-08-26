import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Card, Field, Input, Select } from '@/components/ui'
import { FormPanel } from '@/components/FormPanel'
import { FinancialCalendar } from '@/components/FinancialCalendar'
import { RecurringActivitiesPanel } from '@/components/RecurringActivitiesPanel'
import { SegmentedControl } from '@/components/SegmentedControl'
import { useFinance } from '@/contexts/FinanceContext'
import {
  countActionRequired,
  daysOverdue,
  isActionRequired,
  sortOccurrencesForDisplay,
} from '@/lib/calculations/recurring'
import { OccurrenceTypeLabel, WarningBadge } from '@/lib/visual-icons'
import { formatDisplayDate, monthKeyFromDate, todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import { toMajorUnits } from '@/lib/money'
import { parseAmountInput, parseDayOfMonth } from '@/lib/validation/parse'
import { EXPENSE_CATEGORIES } from '@/types/expense'
import { INCOME_SOURCES } from '@/types/income'
import type { RecurringActivityType, ScheduledOccurrence } from '@/types/recurring'
import type { SupportedCurrency } from '@/types/user'

export function useNotificationCount(): number {
  const finance = useFinance()
  return useMemo(
    () => countActionRequired(finance.scheduledOccurrences),
    [finance.scheduledOccurrences],
  )
}

type NotificationsSubview = 'actions' | 'calendar' | 'recurring'

export function NotificationsTab({ currency }: { currency: SupportedCurrency }) {
  const finance = useFinance()
  const { ensureRecurringActivities } = finance
  const today = todayIsoDate()
  const [subTab, setSubTab] = useState<NotificationsSubview>('actions')

  useEffect(() => {
    void ensureRecurringActivities()
  }, [ensureRecurringActivities])

  const sorted = useMemo(
    () =>
      sortOccurrencesForDisplay(
        finance.scheduledOccurrences.filter((item) => !item.isDeleted),
      ),
    [finance.scheduledOccurrences],
  )

  const actionRequired = sorted.filter((item) => isActionRequired(item.status))
  const upcoming = sorted.filter((item) => item.status === 'UPCOMING')

  const [recording, setRecording] = useState<ScheduledOccurrence | null>(null)
  const [skipping, setSkipping] = useState<ScheduledOccurrence | null>(null)
  const [actualAmount, setActualAmount] = useState('')
  const [actualDate, setActualDate] = useState(today)
  const [note, setNote] = useState('')
  const [skipReason, setSkipReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [recurringType, setRecurringType] = useState<RecurringActivityType>('INCOME')
  const [recurringName, setRecurringName] = useState('')
  const [recurringAmount, setRecurringAmount] = useState('')
  const [recurringDay, setRecurringDay] = useState('1')
  const [recurringCategory, setRecurringCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>('Other')
  const [recurringIncomeSource, setRecurringIncomeSource] = useState('Salary')

  function openRecord(occurrence: ScheduledOccurrence) {
    setRecording(occurrence)
    setActualAmount(String(toMajorUnits(occurrence.expectedAmount, currency)))
    setActualDate(occurrence.scheduledDate)
    setNote('')
  }

  function openSkip(occurrence: ScheduledOccurrence) {
    setSkipping(occurrence)
    setSkipReason('')
  }

  async function onRecord(event: FormEvent) {
    event.preventDefault()
    if (!recording) return
    const parsed = parseAmountInput(actualAmount, currency)
    if (!parsed.ok) {
      toast.error(parsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.recordOccurrence(recording, {
        actualAmount: parsed.minor,
        actualDate,
        note: note || undefined,
      })
      toast.success('Transaction recorded')
      setRecording(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not record')
    } finally {
      setBusy(false)
    }
  }

  async function onSkip(event: FormEvent) {
    event.preventDefault()
    if (!skipping) return
    setBusy(true)
    try {
      await finance.skipOccurrence(skipping, skipReason || undefined)
      toast.success('Skipped')
      setSkipping(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not skip')
    } finally {
      setBusy(false)
    }
  }

  async function onAddRecurring(event: FormEvent) {
    event.preventDefault()
    const amountParsed = parseAmountInput(recurringAmount, currency)
    if (!amountParsed.ok) {
      toast.error(amountParsed.message)
      return
    }
    const dayParsed = parseDayOfMonth(recurringDay)
    if (!dayParsed.ok) {
      toast.error(dayParsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.addRecurringActivity({
        type: recurringType,
        name: recurringName.trim(),
        amount: amountParsed.minor,
        frequency: 'MONTHLY',
        scheduledDay: dayParsed.day,
        startDate: today,
        status: 'ACTIVE',
        sourceEntityType: 'manual',
        expenseCategory: recurringType === 'EXPENSE' ? recurringCategory : undefined,
        incomeSource: recurringType === 'INCOME' ? recurringIncomeSource : undefined,
      })
      toast.success('Recurring activity added')
      setAddOpen(false)
      setRecurringName('')
      setRecurringAmount('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink dark:text-white">Scheduled finances</h2>
          <p className="text-sm text-ink-muted">
            Nirvana knows what was planned — you confirm what actually happened.
          </p>
        </div>
        <Button variant="secondary" className="shrink-0" onClick={() => setAddOpen(true)}>
          Add recurring
        </Button>
      </div>

      <SegmentedControl
        value={subTab}
        onChange={setSubTab}
        options={[
          {
            value: 'actions',
            label: 'Confirm',
            badge: actionRequired.length > 0 ? actionRequired.length : undefined,
          },
          { value: 'calendar', label: 'Calendar' },
          { value: 'recurring', label: 'Recurring' },
        ]}
      />

      {subTab === 'actions' ? (
        <div className="space-y-6">
          {actionRequired.length > 0 ? (
            <section className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-ink dark:text-white">Action required</h3>
                <p className="text-sm text-ink-muted">
                  {actionRequired.length} transaction{actionRequired.length === 1 ? '' : 's'} need
                  your confirmation
                </p>
              </div>
              <div className="space-y-3">
                {actionRequired.map((occurrence) => (
                  <OccurrenceCard
                    key={occurrence.id}
                    occurrence={occurrence}
                    currency={currency}
                    today={today}
                    onRecord={() => openRecord(occurrence)}
                    onSkip={() => openSkip(occurrence)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <Card variant="flat" className="text-center">
              <p className="text-sm font-medium text-ink dark:text-white">All caught up</p>
              <p className="mt-1 text-sm text-ink-muted">
                Nothing needs confirmation right now.
              </p>
            </Card>
          )}

          {upcoming.length > 0 ? (
            <section className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-ink dark:text-white">Upcoming preview</h3>
                <p className="text-sm text-ink-muted">Next scheduled activities</p>
              </div>
              <div className="space-y-2">
                {upcoming.slice(0, 5).map((occurrence) => (
                  <div
                    key={occurrence.id}
                    className="flex items-center justify-between gap-3 rounded-[16px] bg-surface px-4 py-3 dark:bg-surface-dark"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink dark:text-white">
                        <OccurrenceTypeLabel type={occurrence.type} name={occurrence.name} />
                      </p>
                      <p className="text-xs text-ink-muted">
                        {formatDisplayDate(occurrence.scheduledDate)}
                      </p>
                    </div>
                    <p className="font-display text-sm font-semibold text-ink dark:text-white">
                      {formatMoney(occurrence.expectedAmount, currency, { compact: true })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {subTab === 'calendar' ? (
        <FinancialCalendar
          occurrences={sorted}
          currency={currency}
          startMonthKey={monthKeyFromDate(today)}
          today={today}
        />
      ) : null}

      {subTab === 'recurring' ? <RecurringActivitiesPanel currency={currency} /> : null}

      <FormPanel
        open={recording !== null}
        onOpenChange={(open) => {
          if (!open) setRecording(null)
        }}
        title="Confirm transaction"
      >
        {recording ? (
          <form className="space-y-4" onSubmit={onRecord}>
            <div className="rounded-[16px] bg-surface px-4 py-4 dark:bg-surface-dark">
              <p className="font-semibold text-ink dark:text-white">
                <OccurrenceTypeLabel type={recording.type} name={recording.name} />
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Expected amount</dt>
                  <dd className="font-medium">
                    {formatMoney(recording.expectedAmount, currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Scheduled date</dt>
                  <dd className="font-medium">{formatDisplayDate(recording.scheduledDate)}</dd>
                </div>
              </dl>
            </div>
            <Field label="Actual amount">
              <Input
                inputMode="decimal"
                value={actualAmount}
                onChange={(event) => setActualAmount(event.target.value)}
                required
              />
            </Field>
            <Field label="Actual date">
              <Input
                type="date"
                value={actualDate}
                onChange={(event) => setActualDate(event.target.value)}
                required
              />
            </Field>
            <Field label="Note" hint="Optional">
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? 'Recording…' : 'Confirm & Record'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setRecording(null)}
            >
              Not yet
            </Button>
            <p className="text-center text-xs text-ink-muted">
              We&apos;ll keep this transaction waiting for your confirmation.
            </p>
          </form>
        ) : null}
      </FormPanel>

      <FormPanel
        open={skipping !== null}
        onOpenChange={(open) => {
          if (!open) setSkipping(null)
        }}
        title="Skip scheduled activity?"
      >
        {skipping ? (
          <form className="space-y-4" onSubmit={onSkip}>
            <div className="rounded-[16px] bg-surface px-4 py-4 text-center dark:bg-surface-dark">
              <p className="font-display text-2xl font-semibold text-ink dark:text-white">
                {formatMoney(skipping.expectedAmount, currency)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {formatDisplayDate(skipping.scheduledDate)}
              </p>
            </div>
            <Field label="Reason" hint="Optional">
              <Input
                value={skipReason}
                onChange={(event) => setSkipReason(event.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Button type="submit" variant="danger" className="w-full" size="lg" disabled={busy}>
              {busy ? 'Skipping…' : 'Skip'}
            </Button>
          </form>
        ) : null}
      </FormPanel>

      <RecurringActivityForm
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={onAddRecurring}
        busy={busy}
        recurringType={recurringType}
        setRecurringType={setRecurringType}
        recurringName={recurringName}
        setRecurringName={setRecurringName}
        recurringAmount={recurringAmount}
        setRecurringAmount={setRecurringAmount}
        recurringDay={recurringDay}
        setRecurringDay={setRecurringDay}
        recurringCategory={recurringCategory}
        setRecurringCategory={setRecurringCategory}
        recurringIncomeSource={recurringIncomeSource}
        setRecurringIncomeSource={setRecurringIncomeSource}
      />
    </div>
  )
}

function RecurringActivityForm({
  open,
  onOpenChange,
  onSubmit,
  busy,
  recurringType,
  setRecurringType,
  recurringName,
  setRecurringName,
  recurringAmount,
  setRecurringAmount,
  recurringDay,
  setRecurringDay,
  recurringCategory,
  setRecurringCategory,
  recurringIncomeSource,
  setRecurringIncomeSource,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent) => void
  busy: boolean
  recurringType: RecurringActivityType
  setRecurringType: (value: RecurringActivityType) => void
  recurringName: string
  setRecurringName: (value: string) => void
  recurringAmount: string
  setRecurringAmount: (value: string) => void
  recurringDay: string
  setRecurringDay: (value: string) => void
  recurringCategory: (typeof EXPENSE_CATEGORIES)[number]
  setRecurringCategory: (value: (typeof EXPENSE_CATEGORIES)[number]) => void
  recurringIncomeSource: string
  setRecurringIncomeSource: (value: string) => void
}) {
  return (
    <FormPanel open={open} onOpenChange={onOpenChange} title="Add recurring activity">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Type">
          <Select
            value={recurringType}
            onChange={(event) => setRecurringType(event.target.value as RecurringActivityType)}
          >
            <option value="INCOME">Recurring income</option>
            <option value="EXPENSE">Recurring expense</option>
          </Select>
        </Field>
        <Field label="Name">
          <Input
            value={recurringName}
            onChange={(event) => setRecurringName(event.target.value)}
            placeholder={recurringType === 'INCOME' ? 'Salary' : 'Rent'}
            required
          />
        </Field>
        <Field label="Amount">
          <Input
            inputMode="decimal"
            value={recurringAmount}
            onChange={(event) => setRecurringAmount(event.target.value)}
            required
          />
        </Field>
        <Field label="Day of month">
          <Input
            inputMode="numeric"
            value={recurringDay}
            onChange={(event) => setRecurringDay(event.target.value)}
            placeholder="1–31"
            required
          />
        </Field>
        {recurringType === 'INCOME' ? (
          <Field label="Income source">
            <Select
              value={recurringIncomeSource}
              onChange={(event) => setRecurringIncomeSource(event.target.value)}
            >
              {INCOME_SOURCES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Category">
            <Select
              value={recurringCategory}
              onChange={(event) =>
                setRecurringCategory(event.target.value as typeof recurringCategory)
              }
            >
              {EXPENSE_CATEGORIES.filter((item) => item !== 'EMI').map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? 'Saving…' : 'Save recurring activity'}
        </Button>
      </form>
    </FormPanel>
  )
}

function OccurrenceCard({
  occurrence,
  currency,
  today,
  onRecord,
  onSkip,
}: {
  occurrence: ScheduledOccurrence
  currency: SupportedCurrency
  today: string
  onRecord: () => void
  onSkip: () => void
}) {
  const overdueDays = daysOverdue(occurrence.scheduledDate, today)
  const isOverdue = occurrence.status === 'OVERDUE'
  const isDue = occurrence.status === 'DUE'

  return (
    <Card>
      {isOverdue ? (
        <p className="flex items-center gap-1 text-xs font-semibold text-danger">
          <WarningBadge /> Overdue
        </p>
      ) : isDue ? (
        <p className="text-xs font-semibold text-accent">Due today</p>
      ) : (
        <p className="text-xs font-semibold text-ink-muted">Upcoming</p>
      )}
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink dark:text-white">
            <OccurrenceTypeLabel type={occurrence.type} name={occurrence.name} />
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {isOverdue
              ? `Scheduled ${overdueDays} day${overdueDays === 1 ? '' : 's'} ago`
              : `Scheduled for ${formatDisplayDate(occurrence.scheduledDate)}`}
          </p>
        </div>
        <p className="font-display text-lg font-semibold text-ink dark:text-white">
          {formatMoney(occurrence.expectedAmount, currency, { compact: true })}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={onRecord}>Record</Button>
        <Button variant="secondary" className="flex-1" onClick={onSkip}>Skip</Button>
      </div>
    </Card>
  )
}
