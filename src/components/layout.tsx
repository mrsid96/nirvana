import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tabItems, tabTitles } from '@/lib/navigation'
import { quickActions } from '@/lib/quick-actions'
import { OfflineBanner } from '@/components/OfflineBanner'
import { FinanceErrorBanner } from '@/components/FinanceErrorBanner'
import { FabMenu } from '@/components/FabMenu'
import { QuickSheets } from '@/components/QuickSheets'
import { PageTitleProvider, usePageTitleValue } from '@/contexts/PageTitleContext'
import { QuickActionProvider, useQuickAction } from '@/contexts/QuickActionContext'
import { PwaInstallLink } from '@/components/PwaInstallLink'
import { isMainTabRoute } from '@/lib/routes'

function getRouteMeta(pathname: string) {
  if (pathname.startsWith('/wealth/')) {
    return { backTo: '/wealth', fallbackTitle: 'Goal' }
  }
  if (pathname.startsWith('/loans/')) {
    return { backTo: '/loans', fallbackTitle: 'Loan' }
  }
  return { backTo: null, fallbackTitle: tabTitles[pathname] ?? 'Nirvana' }
}

function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const customTitle = usePageTitleValue()
  const { backTo, fallbackTitle } = getRouteMeta(location.pathname)
  const title = customTitle ?? fallbackTitle
  const isDetailPage =
    location.pathname.startsWith('/wealth/') || location.pathname.startsWith('/loans/')

  if (!isDetailPage) return null

  return (
    <header className="sticky top-0 z-20 bg-canvas/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden dark:bg-canvas-dark/90">
      <div className="flex h-12 items-center gap-1 px-1">
        {backTo ? (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-accent active:bg-ink/5"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </button>
        ) : (
          <div className="min-w-3" />
        )}
        <h1 className="flex-1 truncate text-[17px] font-semibold tracking-tight text-ink dark:text-white">
          {title}
        </h1>
        <div className="min-w-11" />
      </div>
    </header>
  )
}

function DesktopSidebar() {
  const { setOpen } = useQuickAction()

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-ink/5 p-5 lg:flex dark:border-white/10">
      <nav className="space-y-1">
        {tabItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-white'
                  : 'text-ink-muted hover:bg-ink/5 dark:hover:bg-white/5',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 space-y-1 border-t border-ink/5 pt-4 dark:border-white/10">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Quick add
        </p>
        {quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => setOpen(action.key)}
            className="flex min-h-10 w-full items-center gap-3 rounded-[14px] px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/5 dark:hover:bg-white/5"
          >
            <span className={cn('grid h-7 w-7 place-items-center rounded-full', action.color)}>
              <action.icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            {action.label}
          </button>
        ))}
      </div>
    </aside>
  )
}

function AppShellContent() {
  const [fabExpanded, setFabExpanded] = useState(false)
  const { open, setOpen } = useQuickAction()
  const location = useLocation()
  const showPwaInstall = isMainTabRoute(location.pathname)

  return (
    <div className="relative min-h-dvh text-ink dark:text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[#f8f7f3] dark:bg-[#1c1a17]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -left-24 top-0 -z-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl dark:bg-accent/20"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -right-16 top-1/4 -z-10 h-56 w-56 rounded-full bg-mint/15 blur-3xl dark:bg-mint/10"
        aria-hidden
      />
      <div className="mx-auto flex min-h-dvh w-full max-w-[1280px]">
        <DesktopSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <div className="px-5 pt-2 lg:px-8 lg:pt-4">
            <OfflineBanner />
            <FinanceErrorBanner />
          </div>
          <main className="flex-1 px-5 pb-28 pt-2 lg:px-8 lg:pb-10 lg:pt-6">
            <Outlet />
            {showPwaInstall ? (
              <div className="mt-8 flex justify-center pb-2 lg:mt-10">
                <PwaInstallLink />
              </div>
            ) : null}
          </main>
          <FabMenu expanded={fabExpanded} onToggle={() => setFabExpanded((v) => !v)} />
          <QuickSheets open={open} onOpenChange={setOpen} />
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  return (
    <PageTitleProvider>
      <QuickActionProvider>
        <AppShellContent />
      </QuickActionProvider>
    </PageTitleProvider>
  )
}
