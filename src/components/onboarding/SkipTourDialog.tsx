import { Button } from '@/components/ui'
import { useAppTour } from '@/contexts/AppTourContext'

export function SkipTourDialog() {
  const { skipConfirmOpen, confirmSkip, cancelSkip } = useAppTour()

  if (!skipConfirmOpen) return null

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/40 px-6 backdrop-blur-[2px] dark:bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Skip the tour?"
    >
      <div className="w-full max-w-sm rounded-[24px] border border-ink/8 bg-surface p-6 shadow-[var(--shadow-soft)] dark:border-white/10 dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-ink dark:text-white">Skip the tour?</h2>
        <p className="mt-2 text-sm text-ink-muted">You can always explore Nirvana yourself.</p>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={cancelSkip}>
            Continue Tour
          </Button>
          <Button type="button" className="flex-1" onClick={confirmSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
}
