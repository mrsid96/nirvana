import { Card } from '@/components/ui'
import { formatPercent } from '@/lib/formatters/currency'
import { cn } from '@/lib/utils'

type HealthData = {
  savingsRate: number
  savingsLabel: string
  investmentRate: number
  investmentLabel: string
  debtToIncome: number
  debtLabel: string
  loanBurden: number
  overallLabel: string
}

function overallTone(label: string) {
  const lower = label.toLowerCase()
  if (lower.includes('excellent') || lower.includes('good') || lower.includes('great')) {
    return { bg: 'bg-mint/15 text-mint', ring: 'ring-mint/30' }
  }
  if (lower.includes('fair') || lower.includes('okay')) {
    return { bg: 'bg-yellow/20 text-[#B8922A]', ring: 'ring-yellow/30' }
  }
  return { bg: 'bg-peach/15 text-peach', ring: 'ring-peach/30' }
}

export function HealthCard({ health, message }: { health: HealthData; message: string }) {
  const tone = overallTone(health.overallLabel)

  return (
    <Card>
      <h2 className="font-semibold text-ink dark:text-white">Financial health</h2>
      <div className="mt-4 flex items-center gap-4">
        <div
          className={cn(
            'grid h-16 w-16 shrink-0 place-items-center rounded-full ring-4',
            tone.bg,
            tone.ring,
          )}
        >
          <span className="text-center text-[10px] font-bold uppercase leading-tight tracking-wide">
            {health.overallLabel.split(' ')[0]}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">{message}</p>
      </div>
      <ul className="mt-5 space-y-3 border-t border-ink/5 pt-4 text-sm dark:border-white/5">
        <li className="flex justify-between gap-4">
          <span className="text-ink-muted">Savings rate</span>
          <span className="font-medium text-ink dark:text-white">
            {formatPercent(health.savingsRate)} · {health.savingsLabel}
          </span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-ink-muted">Investment rate</span>
          <span className="font-medium text-ink dark:text-white">
            {formatPercent(health.investmentRate)} · {health.investmentLabel}
          </span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-ink-muted">Debt-to-income</span>
          <span className="font-medium text-ink dark:text-white">
            {formatPercent(health.debtToIncome)} · {health.debtLabel}
          </span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-ink-muted">Loan burden</span>
          <span className="font-medium text-ink dark:text-white">
            {formatPercent(health.loanBurden)}
          </span>
        </li>
      </ul>
    </Card>
  )
}
