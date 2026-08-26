import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { COMMAND_GUIDE_CATEGORIES } from '@/lib/command-bar/examples'
import { WIKI_GUIDE, WIKI_TERMINOLOGY } from '@/lib/profile-wiki'

type WikiTab = 'terminology' | 'guide' | 'parser'

const TABS: { id: WikiTab; label: string }[] = [
  { id: 'terminology', label: 'Terminology' },
  { id: 'guide', label: 'Using Nirvana' },
  { id: 'parser', label: 'Sentence parser' },
]

export function ProfileWikiSection() {
  const [tab, setTab] = useState<WikiTab>('terminology')
  const [openParserCategory, setOpenParserCategory] = useState<string | null>('goal')

  return (
    <Card className="p-0">
      <div className="flex flex-wrap gap-1 border-b border-ink/5 p-2 dark:border-white/10">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-[10px] px-3 py-1.5 text-xs font-medium transition',
              tab === item.id
                ? 'bg-accent text-white'
                : 'text-ink-muted hover:bg-ink/5 dark:hover:bg-white/5',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'terminology' ? (
          <dl className="space-y-4">
            {WIKI_TERMINOLOGY.map((item) => (
              <div key={item.term}>
                <dt className="text-sm font-semibold text-ink dark:text-white">{item.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{item.definition}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {tab === 'guide' ? (
          <ol className="space-y-4">
            {WIKI_GUIDE.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-white">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {tab === 'parser' ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-ink-muted">
              Type phrases like these in the command bar. Include amounts, dates, and goal or loan
              names when you can — Nirvana will ask you to confirm before saving.
            </p>
            <div className="divide-y divide-ink/5 rounded-[14px] border border-ink/8 dark:divide-white/10 dark:border-white/10">
              {COMMAND_GUIDE_CATEGORIES.map((category) => {
                const open = openParserCategory === category.id
                return (
                  <div key={category.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                      aria-expanded={open}
                      onClick={() => setOpenParserCategory(open ? null : category.id)}
                    >
                      <span className="text-sm font-medium text-ink dark:text-white">
                        {category.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-ink-muted transition-transform',
                          open && 'rotate-180',
                        )}
                        aria-hidden
                      />
                    </button>
                    {open ? (
                      <div className="space-y-2 border-t border-ink/8 px-3 py-2 dark:border-white/10">
                        <p className="text-xs text-ink-muted">{category.description}</p>
                        {category.examples.map((example) => (
                          <p
                            key={example.id}
                            className="rounded-[10px] bg-surface/80 px-3 py-2 text-sm text-ink dark:bg-surface-dark/80 dark:text-white/90"
                          >
                            &ldquo;{example.phrase}&rdquo;
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
