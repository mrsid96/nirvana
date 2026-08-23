import { Plus, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { tabItems } from '@/lib/navigation'
import { quickActions, type QuickSheet } from '@/lib/quick-actions'
import { useQuickAction } from '@/contexts/QuickActionContext'

function TabLink({
  item,
  location,
  dimmed = false,
}: {
  item: (typeof tabItems)[number]
  location: string
  dimmed?: boolean
}) {
  const active = item.to === '/' ? location === '/' : location.startsWith(item.to)

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[16px] py-2 text-[10px] font-semibold transition-all duration-200 active:scale-95',
        active ? 'text-accent' : 'text-ink-muted',
        dimmed && 'pointer-events-none opacity-40',
      )}
    >
      <span
        className={cn(
          'grid h-8 w-8 place-items-center rounded-full transition-colors',
          active && 'bg-accent/12',
        )}
      >
        <item.icon className={cn('h-[18px] w-[18px]', active && 'stroke-[2.5]')} />
      </span>
      {item.label}
    </NavLink>
  )
}

export function FabMenu({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const location = useLocation()
  const { setOpen } = useQuickAction()
  const left = tabItems.slice(0, 2)
  const right = tabItems.slice(2)

  function pick(action: QuickSheet) {
    onToggle()
    if (action) setOpen(action)
  }

  return (
    <>
      {expanded ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden"
          aria-label="Close menu"
          onClick={onToggle}
        />
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <div
          className={cn(
            'mx-auto mb-3 max-w-[390px] transition-all duration-200',
            expanded ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {quickActions.map((action, index) => (
              <button
                key={action.key}
                type="button"
                onClick={() => pick(action.key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-[16px] border border-ink/5 bg-surface px-1 py-2.5 shadow-[var(--shadow-soft)] transition-all duration-200 ease-out active:scale-95 dark:border-white/10 dark:bg-surface-dark',
                  expanded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                )}
                style={{ transitionDelay: expanded ? `${index * 35}ms` : '0ms' }}
              >
                <span className={cn('grid h-9 w-9 place-items-center rounded-full', action.color)}>
                  <action.icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-center text-[9px] font-semibold leading-tight text-ink dark:text-white">
                  {action.shortLabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        <nav
          className="mx-auto flex max-w-[390px] items-center gap-1 rounded-[22px] border border-ink/5 bg-surface/95 px-1.5 py-1.5 shadow-[var(--shadow-nav)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/95"
          aria-label="Main navigation"
        >
          {left.map((item) => (
            <TabLink key={item.to} item={item} location={location.pathname} dimmed={expanded} />
          ))}

          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? 'Close actions' : 'Quick actions'}
            aria-expanded={expanded}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[16px] py-2 transition-all duration-200 active:scale-95',
              expanded ? 'text-ink dark:text-white' : 'text-accent',
            )}
          >
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full transition-colors',
                expanded
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'bg-accent text-white',
              )}
            >
              {expanded ? (
                <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
              ) : (
                <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
              )}
            </span>
            <span className="text-[10px] font-semibold">{expanded ? 'Close' : 'Add'}</span>
          </button>

          {right.map((item) => (
            <TabLink key={item.to} item={item} location={location.pathname} dimmed={expanded} />
          ))}
        </nav>
      </div>
    </>
  )
}
