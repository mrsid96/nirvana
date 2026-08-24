import { Button, Field, Input, Select } from '@/components/ui'
import { EXPENSE_CATEGORIES } from '@/types/expense'
import { INCOME_SOURCES } from '@/types/income'
import {
  EDITABLE_WRITE_INTENTS,
  INTENT_LABELS,
  type EditableWriteIntent,
} from '@/lib/command-bar/labels'
import type { StructuredIntent } from '@/lib/command-bar/types'

export function CommandBarEditForm({
  structured,
  goals,
  assets,
  loans,
  onChange,
  onSave,
  onCancel,
}: {
  structured: StructuredIntent
  goals: Array<{ id: string; name: string }>
  assets: Array<{ id: string; name: string; goalId: string }>
  loans: Array<{ id: string; name: string }>
  onChange: (next: StructuredIntent) => void
  onSave: () => void
  onCancel: () => void
}) {
  const intent = structured.intent
  const isEditableIntent = EDITABLE_WRITE_INTENTS.includes(intent as EditableWriteIntent)
  const goalAssets = assets.filter((a) => a.goalId === structured.goalId)

  const amountMajor = structured.amount ? String(structured.amount / 100) : ''

  return (
    <div className="space-y-3 rounded-[14px] border border-ink/8 bg-surface/80 p-3 dark:border-white/10 dark:bg-surface-dark/80">
      {isEditableIntent ? (
        <Field label="Type">
          <Select
            value={intent}
            onChange={(e) =>
              onChange({ ...structured, intent: e.target.value as StructuredIntent['intent'] })
            }
            aria-label="Edit intent type"
          >
            {EDITABLE_WRITE_INTENTS.map((key) => (
              <option key={key} value={key}>{INTENT_LABELS[key]}</option>
            ))}
          </Select>
        </Field>
      ) : (
        <p className="text-sm font-medium text-ink dark:text-white">{INTENT_LABELS[intent]}</p>
      )}

      <Field label="Amount">
        <Input
          type="number"
          inputMode="decimal"
          value={amountMajor}
          onChange={(e) => {
            const major = Number(e.target.value)
            onChange({
              ...structured,
              amount: Number.isFinite(major) && major > 0 ? Math.round(major * 100) : undefined,
            })
          }}
          aria-label="Edit amount"
        />
      </Field>

      {needsGoal(intent) ? (
        <Field label="Goal">
          <Select
            value={structured.goalId ?? ''}
            onChange={(e) => {
              const goal = goals.find((g) => g.id === e.target.value)
              onChange({
                ...structured,
                goalId: e.target.value || undefined,
                goalName: goal?.name,
                assetId: undefined,
                assetName: undefined,
              })
            }}
            aria-label="Edit goal"
          >
            <option value="">Select goal</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </Field>
      ) : null}

      {needsAsset(intent) ? (
        <Field label="Asset">
          <Select
            value={structured.assetId ?? ''}
            onChange={(e) => {
              const asset = assets.find((a) => a.id === e.target.value)
              onChange({
                ...structured,
                assetId: e.target.value || undefined,
                assetName: asset?.name,
              })
            }}
            aria-label="Edit asset"
          >
            <option value="">Select asset</option>
            {goalAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
      ) : null}

      {needsLoan(intent) ? (
        <Field label="Loan">
          <Select
            value={structured.loanId ?? ''}
            onChange={(e) => {
              const loan = loans.find((l) => l.id === e.target.value)
              onChange({
                ...structured,
                loanId: e.target.value || undefined,
                loanName: loan?.name,
              })
            }}
            aria-label="Edit loan"
          >
            <option value="">Select loan</option>
            {loans.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </Field>
      ) : null}

      {intent === 'ADD_EXPENSE' || intent === 'CREATE_RECURRING_EXPENSE' ? (
        <Field label="Category">
          <Select
            value={String(structured.category ?? 'Other')}
            onChange={(e) => onChange({ ...structured, category: e.target.value })}
            aria-label="Edit category"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      ) : null}

      {intent === 'ADD_INCOME' ? (
        <Field label="Source">
          <Select
            value={String(structured.category ?? 'Salary')}
            onChange={(e) => onChange({ ...structured, category: e.target.value })}
            aria-label="Edit income source"
          >
            {INCOME_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="Date">
        <Input
          type="date"
          value={structured.date ?? ''}
          onChange={(e) => onChange({ ...structured, date: e.target.value || undefined })}
          aria-label="Edit date"
        />
      </Field>

      {intent.includes('RECURRING') ? (
        <Field label="Day of month">
          <Input
            type="number"
            min={1}
            max={31}
            value={structured.dayOfMonth ?? 1}
            onChange={(e) =>
              onChange({
                ...structured,
                dayOfMonth: Number(e.target.value) || 1,
                frequency: 'MONTHLY',
              })
            }
            aria-label="Edit day of month"
          />
        </Field>
      ) : null}

      {(structured.source || intent.includes('INVESTMENT')) ? (
        <Field label="Source / platform">
          <Input
            value={structured.source ?? ''}
            onChange={(e) => onChange({ ...structured, source: e.target.value || undefined })}
            placeholder="Zerodha, Bank..."
            aria-label="Edit source"
          />
        </Field>
      ) : null}

      <div className="flex gap-2 pt-1">
        <Button variant="soft" size="default" className="flex-1" onClick={onSave}>Save</Button>
        <Button variant="ghost" size="default" className="flex-1" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function needsGoal(intent: StructuredIntent['intent']): boolean {
  return [
    'RECORD_INVESTMENT',
    'CREATE_RECURRING_INVESTMENT',
    'RECORD_WITHDRAWAL',
    'CREATE_ASSET',
    'CREATE_GOAL',
  ].includes(intent)
}

function needsAsset(intent: StructuredIntent['intent']): boolean {
  return ['RECORD_INVESTMENT', 'CREATE_RECURRING_INVESTMENT', 'RECORD_WITHDRAWAL'].includes(intent)
}

function needsLoan(intent: StructuredIntent['intent']): boolean {
  return ['RECORD_LOAN_PAYMENT', 'CREATE_RECURRING_EXPENSE', 'CREATE_LOAN'].includes(intent)
}
