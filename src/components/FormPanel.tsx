import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function PanelCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-surface px-4 text-sm font-semibold text-ink shadow-[var(--shadow-soft)] transition active:scale-[0.98] dark:border-white/15 dark:bg-surface-dark dark:text-white"
    >
      Close
      <X className="h-4 w-4" strokeWidth={2.5} />
    </button>
  )
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header className="shrink-0 bg-canvas px-5 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] dark:bg-canvas-dark">
      <div className="flex justify-end">
        <PanelCloseButton onClose={onClose} />
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink dark:text-white">{title}</h1>
    </header>
  )
}

function FormPanelOverlay({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useBodyScrollLock(true)

  return (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-hidden overscroll-none bg-canvas touch-none dark:bg-canvas-dark">
      <PanelHeader title={title} onClose={onClose} />
      <div
        data-overlay-scroll
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </div>
    </div>
  )
}

function FormPanelDialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useBodyScrollLock(true)

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-panel-title"
      onClick={onClose}
    >
      <div
        className={cn(
          'flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-[24px]',
          'bg-canvas shadow-[var(--shadow-soft)] dark:bg-canvas-dark',
          wide ? 'max-w-2xl' : 'max-w-lg',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-ink/5 px-5 pb-4 pt-5 dark:border-white/10">
          <div className="flex justify-end">
            <PanelCloseButton onClose={onClose} />
          </div>
          <h2
            id="form-panel-title"
            className="mt-3 text-xl font-semibold tracking-tight text-ink dark:text-white"
          >
            {title}
          </h2>
        </div>
        <div
          data-overlay-scroll
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/** Full-screen form on mobile, centered dialog on desktop (lg+). */
export function FormPanel({
  open,
  onOpenChange,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const close = () => onOpenChange(false)

  if (!open) return null

  if (isDesktop) {
    return (
      <FormPanelDialog title={title} onClose={close} wide={wide}>
        {children}
      </FormPanelDialog>
    )
  }

  return (
    <FormPanelOverlay title={title} onClose={close}>
      {children}
    </FormPanelOverlay>
  )
}
