import { useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePwaInstall } from '@/hooks/usePwaInstall'

export function PwaInstallLink({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'onGradient'
}) {
  const { canInstall, install, isIos } = usePwaInstall()
  const [iosHintOpen, setIosHintOpen] = useState(false)

  if (!canInstall) return null

  async function onClick() {
    const result = await install()
    if (result.kind === 'ios') setIosHintOpen(true)
  }

  const linkClass =
    variant === 'onGradient'
      ? 'text-white hover:text-white/90'
      : 'text-accent hover:text-accent/80'

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center gap-2 text-sm font-semibold underline underline-offset-4 transition-colors',
          linkClass,
          className,
        )}
      >
        <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
        Install Nirvana on your phone
      </button>

      {iosHintOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-ios-title"
        >
          <div className="w-full max-w-sm rounded-[20px] bg-surface p-5 text-left shadow-[var(--shadow-soft)] dark:bg-surface-dark">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="pwa-ios-title" className="text-base font-semibold leading-snug text-ink dark:text-white">
                Add Nirvana to your home screen
              </h2>
              <button
                type="button"
                onClick={() => setIosHintOpen(false)}
                className="shrink-0 rounded-full p-1 text-ink-muted hover:bg-ink/5"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/12 text-xs font-bold text-accent">
                  1
                </span>
                <p className="text-sm leading-relaxed text-ink-muted">
                  <Share className="mb-0.5 mr-1 inline h-4 w-4 align-text-bottom text-accent" />
                  Tap the <strong className="font-semibold text-ink dark:text-white">Share</strong> button
                  in Safari{isIos ? ' (at the bottom of the screen)' : ''}.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/12 text-xs font-bold text-accent">
                  2
                </span>
                <p className="text-sm leading-relaxed text-ink-muted">
                  Scroll down and tap{' '}
                  <strong className="font-semibold text-ink dark:text-white">Add to Home Screen</strong>.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/12 text-xs font-bold text-accent">
                  3
                </span>
                <p className="text-sm leading-relaxed text-ink-muted">
                  Tap <strong className="font-semibold text-ink dark:text-white">Add</strong> — Nirvana
                  will open like a native app.
                </p>
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </>
  )
}
