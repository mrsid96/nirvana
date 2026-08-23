import { cn } from '@/lib/utils'

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'scrollbar-hide flex gap-1 overflow-x-auto rounded-[14px] bg-ink/5 p-1 dark:bg-white/5',
        className,
      )}
      role="tablist"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-10 flex-1 whitespace-nowrap rounded-[10px] px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.98]',
            value === option.value
              ? 'bg-surface text-accent shadow-[var(--shadow-soft)] dark:bg-surface-dark'
              : 'text-ink-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
