import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import {
  detectMilestones,
  dismissMilestone,
  loadDismissedMilestones,
  type Milestone,
} from '@/lib/milestones'
import { todayIsoDate } from '@/lib/formatters/dates'
import type { SupportedCurrency } from '@/types/user'
import { cn } from '@/lib/utils'

export function useMilestones(currency: SupportedCurrency) {
  const { user } = useAuth()
  const finance = useFinance()
  const asOf = todayIsoDate()

  return useMemo(() => {
    if (!user?.uid || finance.loading) return []
    const all = detectMilestones({
      goals: finance.goals,
      assets: finance.assets,
      loans: finance.loans,
      currency,
      asOf,
    })
    const dismissed = loadDismissedMilestones(user.uid)
    return all.filter((m) => !dismissed.has(m.id))
  }, [user?.uid, finance.loading, finance.goals, finance.assets, finance.loans, currency, asOf])
}

export function MilestoneBanner({
  milestones,
  className,
}: {
  milestones: Milestone[]
  className?: string
}) {
  const { user } = useAuth()
  const [visible, setVisible] = useState(milestones)

  if (visible.length === 0) return null

  const current = visible[0]!

  function dismiss(id: string) {
    if (user?.uid) dismissMilestone(user.uid, id)
    setVisible((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-accent/10 via-mint/10 to-yellow/10 p-4 dark:from-accent/20 dark:via-mint/15 dark:to-yellow/10">
        <button
          type="button"
          onClick={() => dismiss(current.id)}
          className="absolute right-3 top-3 flex min-h-8 min-w-8 items-center justify-center rounded-full text-ink-muted active:bg-ink/5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-2xl">{current.emoji}</p>
        <p className="mt-1 pr-8 font-semibold text-ink dark:text-white">{current.title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{current.body}</p>
        {visible.length > 1 ? (
          <p className="mt-2 text-xs text-ink-faint">+{visible.length - 1} more milestone{visible.length > 2 ? 's' : ''}</p>
        ) : null}
      </div>
    </div>
  )
}
