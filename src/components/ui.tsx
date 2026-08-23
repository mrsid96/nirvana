import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Drawer } from 'vaul'
import { cn } from '@/lib/utils'

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
  size?: 'default' | 'lg'
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50 active:scale-[0.98]',
        size === 'default' && 'min-h-11 rounded-[14px] px-4 text-sm',
        size === 'lg' && 'min-h-[52px] rounded-[16px] px-6 text-base',
        variant === 'primary' &&
          'bg-accent text-white shadow-[var(--shadow-soft)] hover:bg-accent-hover',
        variant === 'secondary' &&
          'border border-ink/8 bg-surface text-ink hover:bg-canvas dark:border-white/10 dark:bg-surface-dark dark:text-white',
        variant === 'ghost' && 'text-ink-muted hover:bg-ink/5 dark:hover:bg-white/5',
        variant === 'danger' && 'bg-danger text-white hover:opacity-90',
        variant === 'soft' && 'bg-accent/10 text-accent hover:bg-accent/15',
        className,
      )}
      {...props}
    />
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'min-h-11 w-full rounded-[14px] border border-ink/8 bg-surface px-3.5 text-base text-ink outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-dark dark:text-white',
          className,
        )}
        {...props}
      />
    )
  },
)

export const AmountInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function AmountInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'font-display w-full border-0 bg-transparent text-center text-4xl font-semibold tracking-tight text-ink outline-none placeholder:text-ink-faint dark:text-white',
          className,
        )}
        inputMode="decimal"
        {...props}
      />
    )
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'h-11 min-h-11 w-full appearance-none rounded-[14px] border border-ink/8 bg-surface bg-[length:1rem] bg-[right_0.875rem_center] bg-no-repeat px-3.5 pr-10 text-base leading-none text-ink outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-dark dark:text-white',
          className,
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        }}
        {...props}
      />
    )
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-[14px] border border-ink/8 bg-surface px-3.5 py-3 text-base text-ink outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-dark dark:text-white',
          className,
        )}
        {...props}
      />
    )
  },
)

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-faint">{hint}</span> : null}
    </label>
  )
}

export function Card({ className, children, variant = 'default' }: { className?: string; children: ReactNode; variant?: 'default' | 'flat' | 'soft' }) {
  return (
    <section
      className={cn(
        'rounded-[20px] p-4',
        variant === 'default' &&
          'border border-ink/5 bg-surface shadow-[var(--shadow-soft)] dark:border-white/5 dark:bg-surface-dark',
        variant === 'flat' && 'bg-surface/60 dark:bg-surface-dark/60',
        variant === 'soft' && 'bg-accent/5 dark:bg-accent/10',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function HeroCard({
  className,
  children,
  gradient = 'violet',
}: {
  className?: string
  children: ReactNode
  gradient?: 'violet' | 'mint' | 'peach'
}) {
  const gradients = {
    violet: 'from-[#6657E8] via-[#5B4DD8] to-[#4F46C8]',
    mint: 'from-[#57C7A3] via-[#4DB896] to-[#3DAF8A]',
    peach: 'from-[#FF9B7A] via-[#F58E6E] to-[#F07A5A]',
  }
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[24px] bg-gradient-to-br p-5 text-white shadow-[var(--shadow-soft)]',
        gradients[gradient],
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative">{children}</div>
    </section>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-0.5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-white">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Pill({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95',
        active
          ? 'bg-accent text-white shadow-sm'
          : 'bg-surface text-ink-muted shadow-[var(--shadow-soft)] dark:bg-surface-dark dark:text-ink-faint',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Progress({
  value,
  color = '#6657E8',
}: {
  value: number
  color?: string
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
  emoji,
}: {
  title: string
  body: string
  action?: ReactNode
  emoji?: string
}) {
  return (
    <div className="rounded-[24px] bg-gradient-to-b from-accent/5 to-transparent px-6 py-12 text-center">
      {emoji ? <p className="text-3xl">{emoji}</p> : null}
      <h3 className="mt-3 font-serif text-xl font-medium text-ink dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function FullPageOverlay({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    const { style: bodyStyle } = document.body
    const { style: htmlStyle } = document.documentElement
    const previous = {
      bodyOverflow: bodyStyle.overflow,
      bodyPosition: bodyStyle.position,
      bodyTop: bodyStyle.top,
      bodyLeft: bodyStyle.left,
      bodyRight: bodyStyle.right,
      bodyWidth: bodyStyle.width,
      htmlOverflow: htmlStyle.overflow,
    }

    bodyStyle.overflow = 'hidden'
    bodyStyle.position = 'fixed'
    bodyStyle.top = `-${scrollY}px`
    bodyStyle.left = '0'
    bodyStyle.right = '0'
    bodyStyle.width = '100%'
    htmlStyle.overflow = 'hidden'

    const preventTouchMove = (event: TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      const scrollable = (target as Element).closest('[data-overlay-scroll]')
      if (!scrollable) {
        event.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventTouchMove)
      bodyStyle.overflow = previous.bodyOverflow
      bodyStyle.position = previous.bodyPosition
      bodyStyle.top = previous.bodyTop
      bodyStyle.left = previous.bodyLeft
      bodyStyle.right = previous.bodyRight
      bodyStyle.width = previous.bodyWidth
      htmlStyle.overflow = previous.htmlOverflow
      window.scrollTo(0, scrollY)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-hidden overscroll-none bg-canvas touch-none dark:bg-canvas-dark">
      <header className="shrink-0 bg-canvas px-5 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] dark:bg-canvas-dark">
        <button
          type="button"
          onClick={onClose}
          className="-ml-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-accent hover:bg-ink/5 active:bg-ink/5"
          aria-label="Go back"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-white">{title}</h1>
      </header>
      <div
        data-overlay-scroll
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </div>
    </div>
  )
}

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] max-w-lg rounded-t-[28px] bg-canvas p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-canvas-dark">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-ink/15 dark:bg-white/20" />
          <Drawer.Title className="mb-5 text-xl font-semibold text-ink dark:text-white">
            {title}
          </Drawer.Title>
          <div className="overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export function ConfirmBar({
  open,
  title,
  body,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  body: string
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-ink/30 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:place-items-center sm:pb-4">
      <div className="w-full max-w-md rounded-[24px] bg-surface p-5 dark:bg-surface-dark">
        <h3 className="text-lg font-semibold text-ink dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-ink-muted">{body}</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
