import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, Landmark, PiggyBank, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OfflineBanner } from '@/components/OfflineBanner'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/wealth', label: 'Wealth', icon: PiggyBank },
  { to: '/loans', label: 'Loans', icon: Landmark },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function AppShell() {
  const location = useLocation()
  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-stone-200 p-4 md:flex dark:border-stone-800">
          <p className="mb-8 px-2 text-lg font-semibold tracking-tight">Codex Wealth</p>
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium',
                    isActive
                      ? 'bg-teal-700 text-white'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="px-4 pt-4 md:px-8">
            <OfflineBanner />
          </div>
          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
            <Outlet />
          </main>
          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/95">
            <ul className="mx-auto grid max-w-lg grid-cols-4">
              {items.map((item) => {
                const active =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to)
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={cn(
                        'flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                        active ? 'text-teal-700' : 'text-stone-500',
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}
