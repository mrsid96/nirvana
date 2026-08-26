import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button, Pill } from '@/components/ui'
import { COMMAND_GUIDE_CATEGORIES, QUICK_INTENT_OPTIONS } from '@/lib/command-bar/examples'
import type { CommandIntent } from '@/lib/command-bar/types'

export function CommandBarGuidePanel({
  input,
  slotHints,
  onExample,
  onIntentPick,
  onRetry,
  onClose,
}: {
  input: string
  slotHints?: string[]
  onExample: (phrase: string) => void
  onIntentPick: (intent: CommandIntent) => void
  onRetry: () => void
  onClose: () => void
}) {
  const [openCategory, setOpenCategory] = useState<string | null>('loan-new')

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink dark:text-white">
            I couldn&apos;t match that confidently
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Pick what you meant, or try a phrase like the examples below.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint">
          ×
        </button>
      </div>

      {slotHints && slotHints.length > 0 ? (
        <p className="rounded-[12px] bg-accent/8 px-3 py-2 text-xs text-ink-muted dark:text-white/70">
          I noticed: {slotHints.join(' · ')}
        </p>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
          What were you trying to do?
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_INTENT_OPTIONS.map((option) => (
            <Pill key={option.id} onClick={() => onIntentPick(option.id)}>
              {option.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Example phrases</p>
        {COMMAND_GUIDE_CATEGORIES.map((category) => {
          const open = openCategory === category.id
          return (
            <div
              key={category.id}
              className="overflow-hidden rounded-[14px] border border-ink/8 dark:border-white/10"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink dark:text-white"
                onClick={() => setOpenCategory(open ? null : category.id)}
              >
                <span>{category.label}</span>
                {open ? (
                  <ChevronDown className="h-4 w-4 text-ink-faint" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-ink-faint" />
                )}
              </button>
              {open ? (
                <div className="space-y-2 border-t border-ink/8 px-3 py-2 dark:border-white/10">
                  <p className="text-xs text-ink-muted">{category.description}</p>
                  {category.examples.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      onClick={() => onExample(example.phrase)}
                      className="block w-full rounded-[10px] bg-surface/80 px-3 py-2 text-left text-sm text-ink transition hover:bg-accent/10 dark:bg-surface-dark/80 dark:text-white"
                    >
                      &quot;{example.phrase}&quot;
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-ink-faint">Your text: {input}</p>
      <Button variant="secondary" onClick={onRetry} className="w-full">
        Edit and try again
      </Button>
    </div>
  )
}
