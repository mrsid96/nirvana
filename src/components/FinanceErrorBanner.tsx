import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { useFinance } from '@/contexts/FinanceContext'

export function FinanceErrorBanner() {
  const finance = useFinance()
  if (!finance.error || finance.loading) return null

  return (
    <div className="mb-4 flex items-start gap-3 rounded-[16px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger dark:border-danger/30 dark:bg-danger/10">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Could not load your data</p>
        <p className="mt-0.5 text-danger/80">{finance.error}</p>
      </div>
      <Button
        variant="ghost"
        className="shrink-0 text-danger"
        onClick={() => void finance.refresh()}
      >
        Retry
      </Button>
    </div>
  )
}
