import { Button } from '@/components/ui'
import { useAppTour } from '@/contexts/AppTourContext'

export function WelcomeScreen() {
  const { beginTourFromWelcome, skipFromWelcome } = useAppTour()

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-canvas/95 px-6 backdrop-blur-sm dark:bg-canvas-dark/95"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Nirvana"
    >
      <div className="w-full max-w-md text-center">
        <div className="rounded-[28px] border border-ink/8 bg-surface p-8 shadow-[var(--shadow-soft)] dark:border-white/10 dark:bg-surface-dark">
          <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">
            Welcome to Nirvana 👋
          </h1>
          <p className="mt-3 text-base text-ink-muted">
            Your money, goals and wealth — all in one place.
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Let&apos;s take a quick tour so you know where everything lives.
          </p>
          <div className="mt-8 space-y-3">
            <Button type="button" size="lg" className="w-full" onClick={beginTourFromWelcome}>
              Take the Tour
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-ink-muted"
              onClick={skipFromWelcome}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
