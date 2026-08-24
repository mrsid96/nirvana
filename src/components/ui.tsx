import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
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
          'border border-ink/8 bg-surface text-ink hover:bg-ink/5 dark:border-white/10 dark:bg-surface-dark dark:text-white dark:hover:bg-white/10',
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

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
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
  fill = false,
}: {
  className?: string
  children: ReactNode
  gradient?: 'violet' | 'mint' | 'peach'
  fill?: boolean
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
      <div className={cn('relative', fill && 'h-full min-h-0')}>{children}</div>
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
    <div className="fixed inset-0 z-[70] grid place-items-end bg-ink/30 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-[2px] sm:place-items-center sm:pb-4 sm:pt-4">
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
