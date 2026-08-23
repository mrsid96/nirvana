import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Progress } from '@/components/ui'
import { formatMoney, formatPercent } from '@/lib/formatters/currency'
import type { SupportedCurrency } from '@/types/user'
import { cn } from '@/lib/utils'

export function LoanCard({
  loanId,
  name,
  outstanding,
  progress,
  emi,
  rate,
  monthsRemaining,
  currency,
  variant = 'default',
}: {
  loanId: string
  name: string
  outstanding: number
  progress: number
  emi: number
  rate: number
  monthsRemaining?: number
  currency: SupportedCurrency
  variant?: 'default' | 'calm'
}) {
  const isHome = /home|house|property/i.test(name)
  const Icon = isHome ? Home : undefined

  return (
    <Link to={`/loans/${loanId}`} className="block active:scale-[0.99] transition-transform">
      <article
        className={cn(
          'rounded-[20px] border p-4 shadow-[var(--shadow-soft)]',
          'border-ink/8 bg-[#faf9f6]',
          'dark:border-white/10 dark:bg-[#2a2826] dark:shadow-none',
          variant === 'calm' &&
            'bg-gradient-to-br from-[#faf9f6] via-[#f5f3ef] to-[#eeecf8] dark:from-[#2e2c29] dark:via-[#2a2826] dark:to-[#252238]',
        )}
      >
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent dark:bg-accent/20">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-ink dark:text-[#f5f5f4]">{name}</h3>
            <p className="font-display mt-1 text-xl font-semibold text-ink dark:text-white">
              {formatMoney(outstanding, currency, { compact: true })}
              <span className="ml-1 text-sm font-normal text-ink-muted dark:text-[#a8a29e]">
                remaining
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={progress} color="#6657E8" />
          <div className="mt-2 flex flex-wrap justify-between gap-1 text-xs text-ink-muted dark:text-[#a8a29e]">
            <span>{formatPercent(progress)} paid</span>
            <span>
              EMI {formatMoney(emi, currency, { compact: true })} · {rate}%
            </span>
            {monthsRemaining !== undefined ? (
              <span>{monthsRemaining} months left</span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  )
}
