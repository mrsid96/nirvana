import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Mic, Pencil, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { CommandBarCreateForm } from '@/components/CommandBarCreateForm'
import { CommandBarEditForm } from '@/components/CommandBarEditForm'
import { CommandBarGuidePanel } from '@/components/CommandBarGuidePanel'
import { Button, Card, Input, Pill } from '@/components/ui'
import { useEffectiveAuth } from '@/contexts/DemoContext'
import { useFinance } from '@/contexts/FinanceContext'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { calculateMonthlyCashFlow } from '@/lib/calculations/cashflow'
import { totalOutstanding } from '@/lib/calculations/loans'
import {
  extractAssetHint,
  extractGoalHint,
  extractLoanHint,
} from '@/lib/command-bar/entities'
import { executeConfirmedIntent } from '@/lib/command-bar/executor'
import {
  CONTEXT_PLACEHOLDERS,
  INTENT_LABELS,
  isCreateIntent,
  isNavigationIntent,
  isQueryIntent,
  PLACEHOLDER_EXAMPLES,
} from '@/lib/command-bar/labels'
import {
  applyClarification,
  parseCommand,
  parseCommandAsync,
  resolvePhaseAfterClarification,
} from '@/lib/command-bar/parser'
import { resolveQuery } from '@/lib/command-bar/queries'
import { extractSlots, structuredFromGuideIntent, summarizeSlots } from '@/lib/command-bar/slot-resolver'
import { validateCreateIntent } from '@/lib/command-bar/validateCreate'
import { speechLocaleForCurrency } from '@/lib/speech/speechRecognition'
import type {
  ClarificationOption,
  CommandIntent,
  FinanceSnapshot,
  ParseResult,
  ParserContext,
  StructuredIntent,
} from '@/lib/command-bar/types'
import { addMonthsIso, formatDisplayDate, todayIsoDate, currentMonthKey } from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import type { SupportedCurrency } from '@/types/user'

type BarState = 'idle' | 'input' | 'result'

export function CommandBar({
  contextKey = 'home',
  goalId,
  assetId,
  loanId,
}: {
  contextKey?: string
  goalId?: string
  assetId?: string
  loanId?: string
}) {
  const { profile } = useEffectiveAuth()
  const finance = useFinance()
  const navigate = useNavigate()
  const { ensureRecurringActivities } = finance
  const currency = (profile?.currency ?? 'INR') as SupportedCurrency
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [barState, setBarState] = useState<BarState>('idle')
  const [text, setText] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<StructuredIntent | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [optionsReturnResult, setOptionsReturnResult] = useState<ParseResult | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  const goals = useMemo(
    () => finance.goals.filter((g) => !g.isDeleted).map((g) => ({ id: g.id, name: g.name })),
    [finance.goals],
  )
  const assets = useMemo(
    () =>
      finance.assets
        .filter((a) => !a.isDeleted)
        .map((a) => ({ id: a.id, name: a.name, goalId: a.goalId })),
    [finance.assets],
  )
  const loans = useMemo(
    () => finance.loans.filter((l) => !l.isDeleted).map((l) => ({ id: l.id, name: l.name })),
    [finance.loans],
  )

  const parserContext = useMemo<ParserContext>(
    () => ({
      currency,
      goals,
      assets,
      loans,
      currentGoalId: goalId,
      currentAssetId: assetId,
      currentLoanId: loanId,
      today: todayIsoDate(),
      scheduledOccurrences: finance.scheduledOccurrences
        .filter((o) => !o.isDeleted)
        .map((o) => ({ id: o.id, name: o.name, status: o.status })),
    }),
    [currency, goals, assets, loans, goalId, assetId, loanId, finance.scheduledOccurrences],
  )

  const financeSnapshot = useMemo<FinanceSnapshot>(() => {
    const month = currentMonthKey()
    const cashFlow = calculateMonthlyCashFlow({
      income: finance.income,
      expenses: finance.expenses,
      transactions: finance.transactions,
      loans: finance.loans,
      loanPayments: finance.loanPayments,
      month,
      includeScheduledEmi: true,
    })
    const assetsTotal = finance.assets.reduce((sum, a) => sum + (a.isDeleted ? 0 : a.currentValue), 0)
    const loansTotal = totalOutstanding(finance.loans)
    return {
      goals: finance.goals
        .filter((g) => !g.isDeleted)
        .map((g) => ({
          id: g.id,
          name: g.name,
          targetAmount: g.targetAmount,
          currentValue: g.currentValue,
        })),
      assets: finance.assets
        .filter((a) => !a.isDeleted)
        .map((a) => ({ id: a.id, name: a.name, goalId: a.goalId, currentValue: a.currentValue })),
      loans: finance.loans
        .filter((l) => !l.isDeleted)
        .map((l) => ({ id: l.id, name: l.name, outstandingAmount: l.outstandingAmount })),
      income: finance.income.map((i) => ({ amount: i.amount, month: i.month })),
      expenses: finance.expenses.map((e) => ({
        amount: e.amount,
        month: e.month,
        category: e.category,
      })),
      transactions: finance.transactions.map((t) => ({
        amount: t.amount,
        month: t.month,
        type: t.type,
      })),
      loanPayments: finance.loanPayments.map((p) => ({ amount: p.amount, month: p.month })),
      currentMonth: month,
      netWorth: assetsTotal - loansTotal,
      cashFlow,
    }
  }, [finance])

  const closedPlaceholder = CONTEXT_PLACEHOLDERS[contextKey] ?? CONTEXT_PLACEHOLDERS.home

  const speech = useSpeechRecognition({
    lang: speechLocaleForCurrency(currency),
    onFinalTranscript: (transcript) => {
      setText(transcript)
      void processInput(transcript)
    },
    onError: (message) => toast.error(message),
  })

  useEffect(() => {
    void ensureRecurringActivities()
  }, [ensureRecurringActivities])

  useEffect(() => {
    if (barState !== 'idle') return
    const timer = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [barState])

  useEffect(() => {
    if (barState === 'input') textareaRef.current?.focus()
  }, [barState])

  const reset = useCallback(() => {
    speech.stop()
    setBarState('idle')
    setText('')
    setParseResult(null)
    setEditing(false)
    setEditDraft(null)
    setEditAmount('')
    setBusy(false)
    setParsing(false)
    setConfirmError(null)
    setOptionsReturnResult(null)
  }, [speech.stop])

  function rememberOptionsScreen(result: ParseResult | null) {
    if (!result) return
    const hasOptionList =
      (result.phase === 'needs_clarification' && (result.clarification?.options.length ?? 0) > 0) ||
      result.phase === 'unknown'
    if (hasOptionList) {
      setOptionsReturnResult(result)
    }
  }

  function goBackToOptions() {
    if (!optionsReturnResult) return
    setParseResult(optionsReturnResult)
    setEditing(false)
    setEditDraft(null)
    setConfirmError(null)
  }

  function openInput() {
    setBarState('input')
    setParseResult(null)
    setOptionsReturnResult(null)
    setEditing(false)
    setEditDraft(null)
    setConfirmError(null)
  }

  async function processInput(input: string) {
    setParsing(true)
    setConfirmError(null)
    setOptionsReturnResult(null)
    try {
      const result = await parseCommandAsync(input, parserContext)
      setParseResult(result)
      setBarState('result')

      if (result.phase === 'ready') {
        handleReadyResult(result.structured)
      }
    } finally {
      setParsing(false)
    }
  }

  function processClauseInput(clause: string) {
    rememberOptionsScreen(parseResult)
    const result = parseCommand(clause, parserContext)
    setParseResult(result)
    setBarState('result')
    setConfirmError(null)

    if (result.phase === 'ready') {
      handleReadyResult(result.structured)
    }
  }

  function handleReadyResult(structured: StructuredIntent) {
    if (isNavigationIntent(structured.intent)) {
      const path = structured.navigationPath
      if (path) {
        navigate(path)
        toast.success('Navigating…')
        reset()
      }
      return
    }
    if (isQueryIntent(structured.intent)) {
      const queryResult = resolveQuery(
        structured.intent,
        financeSnapshot,
        structured,
        currency,
        todayIsoDate(),
        finance.goals,
        finance.assets,
      )
      if (queryResult) {
        setParseResult((prev) =>
          prev ? { ...prev, structured: { ...structured, queryResult } } : null,
        )
      }
    }
  }

  function onGuideExample(phrase: string) {
    setText(phrase)
    void processInput(phrase)
  }

  function onGuideIntentPick(intent: CommandIntent) {
    if (!parseResult) return
    rememberOptionsScreen(parseResult)
    let structured = structuredFromGuideIntent(intent, parseResult.input, parserContext)
    if (intent === 'CREATE_GOAL' || intent === 'CREATE_GOAL_WITH_ASSET') {
      structured = {
        ...structured,
        targetDate: structured.targetDate ?? addMonthsIso(todayIsoDate(), 240),
      }
    }
    const phase = resolvePhaseAfterClarification(structured, parserContext)
    setParseResult({ ...parseResult, structured, phase, clarification: undefined })
  }

  function onSubmit(event?: FormEvent) {
    event?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || parsing) return
    void processInput(trimmed)
  }

  function onClarificationSelect(option: ClarificationOption) {
    if (!parseResult) return
    rememberOptionsScreen(parseResult)

    if (option.type === 'compound') {
      processClauseInput(option.id)
      return
    }

    if (option.id === '__create__') {
      const kind = parseResult.clarification?.kind
      const updated = { ...parseResult.structured }
      if (kind?.includes('goal')) {
        updated.intent = 'CREATE_GOAL'
        updated.goalName = extractGoalHint(parseResult.input) ?? 'New goal'
      } else if (kind?.includes('asset')) {
        updated.intent = 'CREATE_ASSET'
        updated.assetName = extractAssetHint(parseResult.input) ?? 'New asset'
        if (goalId) updated.goalId = goalId
      } else if (kind?.includes('loan')) {
        updated.intent = 'CREATE_LOAN'
        updated.loanName = extractLoanHint(parseResult.input) ?? 'New loan'
      }
      const phase = resolvePhaseAfterClarification(updated, parserContext)
      setParseResult({ ...parseResult, structured: updated, phase, clarification: undefined })
      return
    }

    const updated = applyClarification(
      parseResult.structured,
      option.id,
      option.type,
      parserContext,
    )
    const phase = resolvePhaseAfterClarification(updated, parserContext)

    if (phase === 'needs_clarification') {
      const next = parseCommand(parseResult.input, {
        ...parserContext,
        currentGoalId: updated.goalId ?? parserContext.currentGoalId,
        currentAssetId: updated.assetId ?? parserContext.currentAssetId,
        currentLoanId: updated.loanId ?? parserContext.currentLoanId,
      })
      next.structured = { ...next.structured, ...updated }
      setParseResult(next)
      return
    }

    const nextResult: ParseResult = {
      ...parseResult,
      structured: updated,
      phase,
      clarification: undefined,
    }
    setParseResult(nextResult)

    if (phase === 'ready') {
      handleReadyResult(updated)
    }
  }

  async function onConfirm() {
    if (!parseResult || busy) return
    const structured = parseResult.structured
    if (isNavigationIntent(structured.intent) || isQueryIntent(structured.intent)) {
      reset()
      return
    }

    const createError = validateCreateIntent(structured)
    if (createError) {
      toast.error(createError)
      return
    }

    setBusy(true)
    setConfirmError(null)
    try {
      await executeConfirmedIntent(structured, finance)
      toast.success('Saved.')
      reset()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save'
      setConfirmError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  function startEdit() {
    if (!parseResult) return
    setEditDraft({ ...parseResult.structured })
    setEditing(true)
  }

  function applyEdit() {
    if (!parseResult || !editDraft) return
    const phase = resolvePhaseAfterClarification(editDraft, parserContext)
    setParseResult({
      ...parseResult,
      structured: editDraft,
      phase,
      clarification: undefined,
    })
    setEditing(false)
    setEditDraft(null)
    setConfirmError(null)
  }

  const rotatingExample = PLACEHOLDER_EXAMPLES[placeholderIndex]

  if (barState === 'idle') {
    return (
      <button
        type="button"
        onClick={openInput}
        data-testid="command-bar-open"
        className="group w-full rounded-[20px] border border-accent/15 bg-gradient-to-r from-accent/8 via-accent/5 to-transparent p-4 text-left shadow-[var(--shadow-soft)] transition-all hover:border-accent/25 hover:from-accent/12 dark:border-accent/20 dark:from-accent/15"
        aria-label="Tell Nirvana what happened with your money"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink dark:text-white">{closedPlaceholder}</p>
            <p className="mt-0.5 truncate text-xs text-ink-faint transition-opacity duration-500">
              e.g. {rotatingExample}
            </p>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </button>
    )
  }

  return (
    <Card variant="soft" className="relative overflow-hidden rounded-[20px] p-0">
      <div className="p-4">
        {barState === 'input' ? (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <label htmlFor="command-bar-input" className="text-sm font-medium text-ink-muted">
                Tell Nirvana what happened
              </label>
              <button
                type="button"
                onClick={reset}
                className="rounded-full p-1 text-ink-faint hover:bg-ink/5 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              id="command-bar-input"
              ref={textareaRef}
              value={
                speech.listening && speech.interimTranscript
                  ? `${text} ${speech.interimTranscript}`.trim()
                  : text
              }
              onChange={(e) => setText(e.target.value)}
              placeholder={rotatingExample}
              rows={2}
              className="w-full resize-none rounded-[14px] border border-ink/8 bg-surface px-3.5 py-3 text-base text-ink outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-dark dark:text-white"
              aria-label="Natural language money command"
            />
            <div className="flex items-center justify-between gap-2">
              {speech.supported ? (
                <button
                  type="button"
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-[14px] px-3 text-sm font-medium transition ${
                    speech.listening
                      ? 'animate-pulse bg-danger/15 text-danger'
                      : 'bg-accent/10 text-accent hover:bg-accent/15'
                  }`}
                  aria-label={speech.listening ? 'Stop listening' : 'Start voice input'}
                  aria-pressed={speech.listening}
                >
                  <Mic className="h-4 w-4" />
                  {speech.listening ? 'Listening…' : 'Voice'}
                </button>
              ) : (
                <span />
              )}
              <Button
                type="submit"
                size="default"
                disabled={!text.trim() || parsing}
                aria-label="Submit command"
              >
                {parsing ? (
                  <span className="text-sm">Understanding…</span>
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        ) : null}

        {barState === 'result' && parseResult ? (
          <ResultPanel
            result={parseResult}
            currency={currency}
            goals={goals}
            assets={assets}
            loans={loans}
            editing={editing}
            editDraft={editDraft}
            editAmount={editAmount}
            busy={busy}
            confirmError={confirmError}
            onEditDraftChange={setEditDraft}
            onEditAmountChange={setEditAmount}
            onStartEdit={startEdit}
            onApplyEdit={applyEdit}
            onCancelEdit={() => {
              setEditing(false)
              setEditDraft(null)
            }}
            onConfirm={onConfirm}
            onClarificationSelect={onClarificationSelect}
            onMissingAmount={(minor) => {
              const updated = { ...parseResult.structured, amount: minor }
              const phase = resolvePhaseAfterClarification(updated, parserContext)
              setParseResult({
                ...parseResult,
                structured: updated,
                phase,
                clarification: undefined,
              })
              if (phase === 'ready') handleReadyResult(updated)
            }}
            onRetry={() => {
              setBarState('input')
              setParseResult(null)
              setConfirmError(null)
            }}
            onGuideExample={onGuideExample}
            onGuideIntentPick={onGuideIntentPick}
            parserContext={parserContext}
            onClose={reset}
            onBackToOptions={goBackToOptions}
            canGoBack={optionsReturnResult !== null}
            onStructuredChange={(structured) =>
              setParseResult((prev) => (prev ? { ...prev, structured } : null))
            }
          />
        ) : null}
      </div>
    </Card>
  )
}

function ResultPanel({
  result,
  currency,
  goals,
  assets,
  loans,
  editing,
  editDraft,
  editAmount,
  busy,
  confirmError,
  onEditDraftChange,
  onEditAmountChange,
  onStartEdit,
  onApplyEdit,
  onCancelEdit,
  onConfirm,
  onClarificationSelect,
  onMissingAmount,
  onRetry,
  onGuideExample,
  onGuideIntentPick,
  parserContext,
  onClose,
  onBackToOptions,
  canGoBack,
  onStructuredChange,
}: {
  result: ParseResult
  currency: SupportedCurrency
  goals: Array<{ id: string; name: string }>
  assets: Array<{ id: string; name: string; goalId: string }>
  loans: Array<{ id: string; name: string }>
  editing: boolean
  editDraft: StructuredIntent | null
  editAmount: string
  busy: boolean
  confirmError: string | null
  onEditDraftChange: (v: StructuredIntent) => void
  onEditAmountChange: (v: string) => void
  onStartEdit: () => void
  onApplyEdit: () => void
  onCancelEdit: () => void
  onConfirm: () => void
  onClarificationSelect: (option: ClarificationOption) => void
  onMissingAmount: (minor: number) => void
  onRetry: () => void
  onGuideExample: (phrase: string) => void
  onGuideIntentPick: (intent: CommandIntent) => void
  parserContext: ParserContext
  onClose: () => void
  onBackToOptions: () => void
  canGoBack: boolean
  onStructuredChange: (structured: StructuredIntent) => void
}) {
  const { structured, phase, clarification } = result

  if (phase === 'unknown') {
    return (
      <CommandBarGuidePanel
        input={result.input}
        slotHints={summarizeSlots(extractSlots(result.input, parserContext))}
        onExample={onGuideExample}
        onIntentPick={onGuideIntentPick}
        onRetry={onRetry}
        onClose={onClose}
      />
    )
  }

  if (phase === 'needs_clarification' && clarification) {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-ink dark:text-white">{clarification.question}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint">
            <X className="h-4 w-4" />
          </button>
        </div>
        {clarification.options.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {clarification.options.map((option) => (
              <Pill key={option.id} onClick={() => onClarificationSelect(option)}>
                {option.label}
              </Pill>
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const major = Number(editAmount)
              if (major > 0) onMissingAmount(Math.round(major * 100))
            }}
            className="flex gap-2"
          >
            <Input
              type="number"
              inputMode="decimal"
              value={editAmount}
              onChange={(e) => onEditAmountChange(e.target.value)}
              placeholder="Amount"
              aria-label="Enter amount"
              className="flex-1"
            />
            <Button type="submit" disabled={!editAmount}>Continue</Button>
          </form>
        )}
      </div>
    )
  }

  if (structured.queryResult) {
    const qr = structured.queryResult
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-ink-muted">{qr.title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="font-display text-2xl font-semibold text-ink dark:text-white">{qr.value}</p>
        {qr.subtitle ? <p className="text-sm text-ink-muted">{qr.subtitle}</p> : null}
      </div>
    )
  }

  if (phase === 'needs_confirmation' && isCreateIntent(structured.intent)) {
    return (
      <CommandBarCreateForm
        structured={structured}
        goals={goals}
        onChange={onStructuredChange}
        onConfirm={onConfirm}
        onCancel={onClose}
        onBack={canGoBack ? onBackToOptions : undefined}
        busy={busy}
        confirmError={confirmError}
      />
    )
  }

  if (phase === 'needs_confirmation') {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-ink-muted">I understood this as</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint">
            <X className="h-4 w-4" />
          </button>
        </div>

        {editing && editDraft ? (
          <CommandBarEditForm
            structured={editDraft}
            goals={goals}
            assets={assets}
            loans={loans}
            onChange={onEditDraftChange}
            onSave={onApplyEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-base font-semibold text-ink dark:text-white">
              {INTENT_LABELS[structured.intent]}
            </p>
            {structured.amount ? (
              <p className="font-display text-xl font-semibold text-ink dark:text-white">
                {formatMoney(structured.amount, currency)}
              </p>
            ) : null}
            {structured.goalName ? <DetailRow label="Goal" value={structured.goalName} /> : null}
            {structured.assetName ? <DetailRow label="Asset" value={structured.assetName} /> : null}
            {structured.loanName ? <DetailRow label="Loan" value={structured.loanName} /> : null}
            {structured.scheduledOccurrenceName ? (
              <DetailRow label="Scheduled" value={structured.scheduledOccurrenceName} />
            ) : null}
            {structured.category && !structured.goalName ? (
              <DetailRow label="Category" value={String(structured.category)} />
            ) : null}
            {structured.date ? (
              <DetailRow
                label="Date"
                value={
                  structured.date === todayIsoDate() ? 'Today' : formatDisplayDate(structured.date)
                }
              />
            ) : null}
            {structured.frequency ? (
              <DetailRow
                label="Frequency"
                value={`Monthly${structured.dayOfMonth ? ` (day ${structured.dayOfMonth})` : ''}`}
              />
            ) : null}
            {structured.source ? <DetailRow label="Source" value={structured.source} /> : null}
          </div>
        )}

        {confirmError ? (
          <p className="text-sm text-danger">{confirmError}</p>
        ) : null}

        {!editing ? (
          <div className="flex flex-col gap-2">
            {canGoBack ? (
              <Button variant="secondary" className="w-full" onClick={onBackToOptions}>
                <ArrowLeft className="h-4 w-4" />
                Back to options
              </Button>
            ) : null}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onStartEdit}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button className="flex-1" onClick={onConfirm} disabled={busy}>
                <Check className="h-4 w-4" />
                {confirmError ? 'Retry' : 'Confirm'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return null
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-ink-muted">
      <span className="text-ink-faint">{label}: </span>
      <span className="text-ink dark:text-white">{value}</span>
    </p>
  )
}
