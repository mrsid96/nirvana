import { Button } from '@/components/ui'
import { useDemo } from '@/contexts/DemoContext'
import { cn } from '@/lib/utils'

export function DemoModeBanner() {
  const { isDemoMode, promptSignup, exitDemoMode } = useDemo()

  if (!isDemoMode) return null

  return (
    <div
      className={cn(
        'sticky top-0 z-30 border-b border-accent/20 bg-accent/10 px-4 py-2.5 backdrop-blur-md',
        'dark:border-accent/30 dark:bg-accent/15',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center sm:justify-between sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Demo mode
          </span>
          <p className="text-sm text-ink dark:text-white">
            You&apos;re exploring Nirvana with demo data
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" className="h-9 px-4 text-sm" onClick={() => void promptSignup()}>
            Create your account
          </Button>
          <button
            type="button"
            onClick={exitDemoMode}
            className="text-sm font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline dark:hover:text-white"
          >
            Exit demo
          </button>
        </div>
      </div>
    </div>
  )
}
