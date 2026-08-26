import { Button } from '@/components/ui'
import { useAppTour } from '@/contexts/AppTourContext'

export function TourCompleteScreen() {
  const { finishTour } = useAppTour()

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-canvas/95 px-6 backdrop-blur-sm dark:bg-canvas-dark/95"
      role="dialog"
      aria-modal="true"
      aria-label="Tour complete"
    >
      <div className="w-full max-w-md text-center">
        <div className="rounded-[28px] border border-ink/8 bg-surface p-8 shadow-[var(--shadow-soft)] dark:border-white/10 dark:bg-surface-dark">
          <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">
            You&apos;re ready!
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Your financial journey starts here. Track consistently, understand your money and keep
            moving toward your goals.
          </p>
          <Button type="button" size="lg" className="mt-8 w-full" onClick={finishTour}>
            Let&apos;s Go
          </Button>
        </div>
      </div>
    </div>
  )
}
