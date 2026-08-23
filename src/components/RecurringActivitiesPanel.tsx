import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, Card, ConfirmBar, EmptyState, Field, Input } from '@/components/ui'
import { FormPanel } from '@/components/FormPanel'
import { useFinance } from '@/contexts/FinanceContext'
import {
  formatScheduledDay,
  groupRecurringByType,
  occurrenceTypeEmoji,
  recurringTypeLabel,
} from '@/lib/calculations/recurring'
import { formatMoney } from '@/lib/formatters/currency'
import { toMajorUnits } from '@/lib/money'
import { parseAmountInput, parseDayOfMonth } from '@/lib/validation/parse'
import type { RecurringActivity } from '@/types/recurring'
import type { SupportedCurrency } from '@/types/user'

export function RecurringActivitiesPanel({ currency }: { currency: SupportedCurrency }) {
  const finance = useFinance()
  const [deleting, setDeleting] = useState<RecurringActivity | null>(null)
  const [editing, setEditing] = useState<RecurringActivity | null>(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDay, setEditDay] = useState('1')
  const [busy, setBusy] = useState(false)

  const groups = useMemo(
    () => groupRecurringByType(finance.allRecurringActivities),
    [finance.allRecurringActivities],
  )

  const hasAny = groups.some((group) => group.items.length > 0)

  async function togglePause(activity: RecurringActivity) {
    if (activity.sourceEntityType !== 'manual') {
      toast.message('Edit the linked asset or loan to change this schedule')
      return
    }
    setBusy(true)
    try {
      await finance.editRecurringActivity(activity.id, {
        status: activity.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
      })
      toast.success(activity.status === 'ACTIVE' ? 'Paused recurring activity' : 'Resumed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await finance.removeRecurringActivity(deleting.id)
      toast.success('Recurring activity removed')
      setDeleting(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  function openEdit(activity: RecurringActivity) {
    if (activity.sourceEntityType !== 'manual') {
      toast.message('Edit the linked asset or loan to change this schedule')
      return
    }
    setEditing(activity)
    setEditName(activity.name)
    setEditAmount(String(toMajorUnits(activity.amount, currency)))
    setEditDay(String(activity.scheduledDay))
  }

  async function onEdit(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    if (!editName.trim()) {
      toast.error('Enter a name')
      return
    }
    const amountParsed = parseAmountInput(editAmount, currency)
    if (!amountParsed.ok) {
      toast.error(amountParsed.message)
      return
    }
    const dayParsed = parseDayOfMonth(editDay)
    if (!dayParsed.ok) {
      toast.error(dayParsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.editRecurringActivity(editing.id, {
        name: editName.trim(),
        amount: amountParsed.minor,
        scheduledDay: dayParsed.day,
      })
      toast.success('Recurring activity updated')
      setEditing(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  if (!hasAny) {
    return (
      <EmptyState
        emoji="🔁"
        title="No recurring activities"
        body="SIPs, EMIs, salary, and other monthly items will appear here once configured."
      />
    )
  }

  return (
    <div className="space-y-5">
      {groups.map((group) =>
        group.items.length > 0 ? (
          <section key={group.type} className="space-y-2">
            <h3 className="text-sm font-semibold text-ink dark:text-white">{group.label}</h3>
            <div className="space-y-2">
              {group.items.map((activity) => (
                <RecurringRow
                  key={activity.id}
                  activity={activity}
                  currency={currency}
                  busy={busy}
                  onPause={() => void togglePause(activity)}
                  onEdit={() => openEdit(activity)}
                  onDelete={() => setDeleting(activity)}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}

      <ConfirmBar
        open={deleting !== null}
        title="Remove recurring activity?"
        body="Future scheduled occurrences from this rule will stop appearing."
        onCancel={() => setDeleting(null)}
        onConfirm={() => void onDelete()}
      />

      <FormPanel
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        title="Edit recurring activity"
      >
        {editing ? (
          <form className="space-y-4" onSubmit={(event) => void onEdit(event)}>
            <Field label="Name">
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
              />
            </Field>
            <Field label="Amount">
              <Input
                inputMode="decimal"
                value={editAmount}
                onChange={(event) => setEditAmount(event.target.value)}
                required
              />
            </Field>
            <Field label="Day of month">
              <Input
                inputMode="numeric"
                value={editDay}
                onChange={(event) => setEditDay(event.target.value)}
                placeholder="1–31"
                required
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        ) : null}
      </FormPanel>
    </div>
  )
}

function RecurringRow({
  activity,
  currency,
  busy,
  onPause,
  onEdit,
  onDelete,
}: {
  activity: RecurringActivity
  currency: SupportedCurrency
  busy: boolean
  onPause: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isManual = activity.sourceEntityType === 'manual'
  const isPaused = activity.status === 'PAUSED'
  const manageLink =
    activity.sourceEntityType === 'asset' && activity.goalId
      ? `/wealth/${activity.goalId}`
      : activity.sourceEntityType === 'loan' && activity.loanId
        ? `/loans/${activity.loanId}`
        : null

  return (
    <Card variant="flat" className="!rounded-[16px] !p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink dark:text-white">
            {occurrenceTypeEmoji(activity.type)} {activity.name}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {formatScheduledDay(activity.scheduledDay)} · {recurringTypeLabel(activity.type)}
          </p>
          {isPaused ? (
            <p className="mt-1 text-xs font-medium text-ink-muted">Paused</p>
          ) : null}
          {manageLink ? (
            <Link to={manageLink} className="mt-1 text-xs font-medium text-accent">
              Managed via {activity.sourceEntityType}
            </Link>
          ) : null}
        </div>
        <p className="font-display text-sm font-semibold text-ink dark:text-white">
          {formatMoney(activity.amount, currency, { compact: true })}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {isManual ? (
          <>
            <Button
              variant="secondary"
              className="min-h-9 px-3 text-xs"
              disabled={busy}
              onClick={onEdit}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              className="min-h-9 px-3 text-xs"
              disabled={busy}
              onClick={onPause}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="ghost"
              className="min-h-9 px-3 text-xs text-danger"
              disabled={busy}
              onClick={onDelete}
            >
              Delete
            </Button>
          </>
        ) : manageLink ? (
          <Link
            to={manageLink}
            className="inline-flex min-h-9 items-center rounded-[14px] border border-ink/8 bg-surface px-3 text-xs font-semibold text-ink dark:border-white/10 dark:bg-surface-dark dark:text-white"
          >
            Edit source
          </Link>
        ) : null}
      </div>
    </Card>
  )
}
