import type { ReactNode } from 'react'
import { Button, Field, Input, Select, Textarea } from '@/components/ui'
import {
  ASSET_CATEGORY_LABELS,
  ASSET_SOURCE_LABELS,
  type AssetCategory,
  type AssetSource,
  type InvestmentType,
} from '@/types/asset'
import type { GoalPriority } from '@/types/goal'
import { INTENT_LABELS } from '@/lib/command-bar/labels'
import type { StructuredIntent } from '@/lib/command-bar/types'
import { todayIsoDate, addMonthsIso } from '@/lib/formatters/dates'

function major(minor: number | undefined): string {
  return minor ? String(minor / 100) : ''
}

function minorFromMajor(raw: string): number | undefined {
  const major = Number(raw)
  if (!Number.isFinite(major) || major <= 0) return undefined
  return Math.round(major * 100)
}

export function CommandBarCreateForm({
  structured,
  goals,
  onChange,
  onConfirm,
  onCancel,
  onBack,
  busy,
  confirmError,
}: {
  structured: StructuredIntent
  goals: Array<{ id: string; name: string }>
  onChange: (next: StructuredIntent) => void
  onConfirm: () => void
  onCancel: () => void
  onBack?: () => void
  busy: boolean
  confirmError: string | null
}) {
  const today = todayIsoDate()

  if (structured.intent === 'CREATE_GOAL') {
    return (
      <CreateShell
        title={INTENT_LABELS.CREATE_GOAL}
        confirmError={confirmError}
        busy={busy}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onBack={onBack}
      >
        <Field label="Goal name">
          <Input
            value={structured.goalName ?? ''}
            onChange={(e) => onChange({ ...structured, goalName: e.target.value })}
            required
            aria-label="Goal name"
          />
        </Field>
        <Field label="Description" hint="Optional">
          <Textarea
            value={structured.description ?? ''}
            onChange={(e) => onChange({ ...structured, description: e.target.value || undefined })}
            rows={2}
            aria-label="Goal description"
          />
        </Field>
        <Field label="Target amount">
          <Input
            inputMode="decimal"
            value={major(structured.amount)}
            onChange={(e) => onChange({ ...structured, amount: minorFromMajor(e.target.value) })}
            required
            aria-label="Target amount"
          />
        </Field>
        <Field label="Target date">
          <Input
            type="date"
            value={structured.targetDate ?? addMonthsIso(today, 240)}
            onChange={(e) => onChange({ ...structured, targetDate: e.target.value })}
            required
            aria-label="Target date"
          />
        </Field>
        <Field label="Priority">
          <Select
            value={structured.priority ?? 'medium'}
            onChange={(e) =>
              onChange({ ...structured, priority: e.target.value as GoalPriority })
            }
            aria-label="Goal priority"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </Field>
      </CreateShell>
    )
  }

  if (structured.intent === 'CREATE_GOAL_WITH_ASSET') {
    return (
      <CreateShell
        title={INTENT_LABELS.CREATE_GOAL_WITH_ASSET}
        confirmError={confirmError}
        busy={busy}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onBack={onBack}
      >
        <Field label="Goal name">
          <Input
            value={structured.goalName ?? ''}
            onChange={(e) => onChange({ ...structured, goalName: e.target.value })}
            required
            aria-label="Goal name"
          />
        </Field>
        <Field label="Target amount">
          <Input
            inputMode="decimal"
            value={major(structured.amount)}
            onChange={(e) => onChange({ ...structured, amount: minorFromMajor(e.target.value) })}
            required
            aria-label="Target amount"
          />
        </Field>
        <Field label="Target date">
          <Input
            type="date"
            value={structured.targetDate ?? addMonthsIso(today, 240)}
            onChange={(e) => onChange({ ...structured, targetDate: e.target.value })}
            required
            aria-label="Target date"
          />
        </Field>
        <Field label="Investment name">
          <Input
            value={structured.assetName ?? 'Mutual Fund'}
            onChange={(e) => onChange({ ...structured, assetName: e.target.value })}
            required
            aria-label="Asset name"
          />
        </Field>
        <Field label="Monthly investment">
          <Input
            inputMode="decimal"
            value={major(structured.monthlyInvestment)}
            onChange={(e) =>
              onChange({
                ...structured,
                monthlyInvestment: minorFromMajor(e.target.value),
                frequency: 'MONTHLY',
                investmentType: 'SIP',
              })
            }
            required
            aria-label="Monthly RD amount"
          />
        </Field>
        <Field label="Debit day of month">
          <Input
            type="number"
            min={1}
            max={31}
            value={structured.dayOfMonth ?? 1}
            onChange={(e) =>
              onChange({ ...structured, dayOfMonth: Number(e.target.value) || 1 })
            }
            aria-label="Debit day"
          />
        </Field>
      </CreateShell>
    )
  }

  if (structured.intent === 'CREATE_ASSET') {
    const categories = Object.keys(ASSET_CATEGORY_LABELS) as AssetCategory[]
    const sources = Object.keys(ASSET_SOURCE_LABELS) as AssetSource[]
    return (
      <CreateShell
        title={INTENT_LABELS.CREATE_ASSET}
        confirmError={confirmError}
        busy={busy}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onBack={onBack}
      >
        <Field label="Asset name">
          <Input
            value={structured.assetName ?? ''}
            onChange={(e) => onChange({ ...structured, assetName: e.target.value })}
            required
            aria-label="Asset name"
          />
        </Field>
        <Field label="Goal">
          <Select
            value={structured.goalId ?? ''}
            onChange={(e) => {
              const goal = goals.find((g) => g.id === e.target.value)
              onChange({
                ...structured,
                goalId: e.target.value || undefined,
                goalName: goal?.name,
              })
            }}
            required
            aria-label="Goal for asset"
          >
            <option value="">Select goal</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Category">
          <Select
            value={(structured.assetCategory as AssetCategory) ?? 'MF'}
            onChange={(e) =>
              onChange({ ...structured, assetCategory: e.target.value as AssetCategory })
            }
            aria-label="Asset category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{ASSET_CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Platform / source">
          <Select
            value={(structured.source as AssetSource) ?? 'OTHER'}
            onChange={(e) =>
              onChange({ ...structured, source: e.target.value as AssetSource })
            }
            aria-label="Asset source"
          >
            {sources.map((s) => (
              <option key={s} value={s}>{ASSET_SOURCE_LABELS[s]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Current value">
          <Input
            inputMode="decimal"
            value={major(structured.amount)}
            onChange={(e) => onChange({ ...structured, amount: minorFromMajor(e.target.value) })}
            required
            aria-label="Asset value"
          />
        </Field>
        <Field label="Investment type">
          <Select
            value={structured.investmentType ?? 'LUMP_SUM'}
            onChange={(e) =>
              onChange({
                ...structured,
                investmentType: e.target.value as InvestmentType,
              })
            }
            aria-label="Investment type"
          >
            <option value="LUMP_SUM">One-time</option>
            <option value="SIP">Monthly SIP</option>
            <option value="BOTH">Both</option>
          </Select>
        </Field>
        {structured.investmentType === 'SIP' || structured.investmentType === 'BOTH' ? (
          <>
            <Field label="Monthly SIP amount">
              <Input
                inputMode="decimal"
                value={major(structured.monthlyInvestment ?? structured.amount)}
                onChange={(e) =>
                  onChange({
                    ...structured,
                    monthlyInvestment: minorFromMajor(e.target.value),
                    frequency: 'MONTHLY',
                  })
                }
                aria-label="Monthly SIP amount"
              />
            </Field>
            <Field label="SIP day of month">
              <Input
                type="number"
                min={1}
                max={31}
                value={structured.dayOfMonth ?? 1}
                onChange={(e) =>
                  onChange({ ...structured, dayOfMonth: Number(e.target.value) || 1 })
                }
                aria-label="SIP day"
              />
            </Field>
          </>
        ) : null}
        <Field label="Expected CAGR %" hint="Optional">
          <Input
            inputMode="decimal"
            value={structured.expectedCagr != null ? String(structured.expectedCagr) : ''}
            onChange={(e) => {
              const rate = Number(e.target.value)
              onChange({
                ...structured,
                expectedCagr: Number.isFinite(rate) ? rate : undefined,
              })
            }}
            aria-label="Expected CAGR"
          />
        </Field>
      </CreateShell>
    )
  }

  if (structured.intent === 'CREATE_LOAN') {
    return (
      <CreateShell
        title={INTENT_LABELS.CREATE_LOAN}
        confirmError={confirmError}
        busy={busy}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onBack={onBack}
      >
        <Field label="Loan name">
          <Input
            value={structured.loanName ?? ''}
            onChange={(e) => onChange({ ...structured, loanName: e.target.value })}
            required
            aria-label="Loan name"
          />
        </Field>
        <Field label="Bank / lender">
          <Input
            value={structured.bank ?? structured.source ?? ''}
            onChange={(e) => onChange({ ...structured, bank: e.target.value, source: e.target.value })}
            required
            aria-label="Bank name"
          />
        </Field>
        <Field label="Purpose" hint="Optional">
          <Input
            value={structured.purpose ?? ''}
            onChange={(e) => onChange({ ...structured, purpose: e.target.value || undefined })}
            aria-label="Loan purpose"
          />
        </Field>
        <Field label="Description" hint="Optional">
          <Textarea
            value={structured.description ?? ''}
            onChange={(e) => onChange({ ...structured, description: e.target.value || undefined })}
            rows={2}
            aria-label="Loan description"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Original amount">
            <Input
              inputMode="decimal"
              value={major(structured.originalAmount ?? structured.amount)}
              onChange={(e) =>
                onChange({
                  ...structured,
                  originalAmount: minorFromMajor(e.target.value),
                  amount: minorFromMajor(e.target.value),
                })
              }
              required
              aria-label="Original loan amount"
            />
          </Field>
          <Field label="Outstanding">
            <Input
              inputMode="decimal"
              value={major(
                structured.outstandingAmount ?? structured.originalAmount ?? structured.amount,
              )}
              onChange={(e) =>
                onChange({ ...structured, outstandingAmount: minorFromMajor(e.target.value) })
              }
              required
              aria-label="Outstanding amount"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="EMI amount">
            <Input
              inputMode="decimal"
              value={major(structured.emiAmount ?? structured.amount)}
              onChange={(e) => onChange({ ...structured, emiAmount: minorFromMajor(e.target.value) })}
              required
              aria-label="EMI amount"
            />
          </Field>
          <Field label="EMI day">
            <Input
              type="number"
              min={1}
              max={31}
              value={structured.dayOfMonth ?? 5}
              onChange={(e) =>
                onChange({ ...structured, dayOfMonth: Number(e.target.value) || 5 })
              }
              aria-label="EMI day of month"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Interest rate %">
            <Input
              inputMode="decimal"
              value={structured.interestRate != null ? String(structured.interestRate) : '8'}
              onChange={(e) => {
                const rate = Number(e.target.value)
                onChange({
                  ...structured,
                  interestRate: Number.isFinite(rate) ? rate : 8,
                })
              }}
              required
              aria-label="Interest rate"
            />
          </Field>
          <Field label="Tenure (months)">
            <Input
              type="number"
              min={1}
              max={600}
              value={structured.tenureMonths ?? 240}
              onChange={(e) =>
                onChange({ ...structured, tenureMonths: Number(e.target.value) || 240 })
              }
              required
              aria-label="Loan tenure months"
            />
          </Field>
        </div>
        <Field label="Start date">
          <Input
            type="date"
            value={structured.startDate ?? structured.date ?? today}
            onChange={(e) => onChange({ ...structured, startDate: e.target.value })}
            required
            aria-label="Loan start date"
          />
        </Field>
      </CreateShell>
    )
  }

  return null
}

function CreateShell({
  title,
  children,
  confirmError,
  busy,
  onConfirm,
  onCancel,
  onBack,
}: {
  title: string
  children: ReactNode
  confirmError: string | null
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
  onBack?: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink dark:text-white">{title}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-ink-faint"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="space-y-3 rounded-[14px] border border-ink/8 bg-surface/80 p-3 dark:border-white/10 dark:bg-surface-dark/80">
        {children}
      </div>
      {confirmError ? <p className="text-sm text-danger">{confirmError}</p> : null}
      {onBack ? (
        <Button variant="secondary" className="w-full" onClick={onBack}>
          Back to options
        </Button>
      ) : null}
      <Button className="w-full" onClick={onConfirm} disabled={busy}>
        {confirmError ? 'Retry' : 'Create'}
      </Button>
    </div>
  )
}
