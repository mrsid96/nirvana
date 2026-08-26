import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { PROFILE_FAQ } from '@/lib/profile-faq'

export function ProfileFaqSection() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <Card className="divide-y divide-ink/5 dark:divide-white/10 p-0">
      {PROFILE_FAQ.map((item) => {
        const id = item.question
        const isOpen = openId === id
        return (
          <div key={id}>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-ink/5 dark:hover:bg-white/5"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : id)}
            >
              <span className="text-sm font-semibold text-ink dark:text-white">{item.question}</span>
              <ChevronDown
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0 text-ink-muted transition-transform',
                  isOpen && 'rotate-180',
                )}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <p className="px-4 pb-3.5 text-sm leading-relaxed text-ink-muted">{item.answer}</p>
            ) : null}
          </div>
        )
      })}
    </Card>
  )
}
