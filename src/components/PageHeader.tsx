import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  accent,
  subtitle,
  greeting,
  action,
  trailing,
  className,
}: {
  title: string
  accent?: string
  subtitle?: string
  greeting?: string
  action?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex items-start justify-between gap-3 pt-1',
        action || trailing ? 'gap-3' : undefined,
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {greeting ? (
          <p className="text-sm font-medium text-ink-muted">{greeting}</p>
        ) : null}
        <h1
          className={cn(
            'text-[28px] font-semibold leading-tight tracking-tight text-ink dark:text-white lg:text-[32px]',
            greeting ? 'mt-2' : undefined,
          )}
        >
          {title}
          {accent ? (
            <>
              {' '}
              <span className="font-serif font-medium text-accent">{accent}</span>
            </>
          ) : null}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </header>
  )
}
