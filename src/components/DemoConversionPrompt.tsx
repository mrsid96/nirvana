import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import { useDemo } from '@/contexts/DemoContext'

export function DemoConversionPrompt({ className }: { className?: string }) {
  const { isDemoMode, promptSignup } = useDemo()
  const [dismissed, setDismissed] = useState(false)

  if (!isDemoMode || dismissed) return null

  return (
    <Card className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Demo mode</p>
      <h2 className="mt-2 text-lg font-semibold text-ink dark:text-white">
        Ready to track your real finances?
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Create your account to save your data and connect it to your actual financial life.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void promptSignup()}>
          Create your Nirvana account
        </Button>
        <Button type="button" variant="ghost" onClick={() => setDismissed(true)}>
          Keep exploring
        </Button>
      </div>
    </Card>
  )
}
