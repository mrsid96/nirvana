import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout'
import { LoadingScreen } from '@/components/LoadingScreen'
import { AppTourLayer } from '@/components/onboarding/AppTourLayer'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppTourProvider } from '@/contexts/AppTourContext'
import { FinanceProvider } from '@/contexts/FinanceContext'
import { applyThemeToDocument, getStoredTheme, persistTheme } from '@/lib/theme'
import type { ThemeMode } from '@/types/user'

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((mod) => ({ default: mod.DashboardPage })),
)
const GoalDetailPage = lazy(() =>
  import('@/pages/GoalDetailPage').then((mod) => ({ default: mod.GoalDetailPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((mod) => ({ default: mod.LoginPage })),
)
const LoansPage = lazy(() =>
  import('@/pages/LoansPage').then((mod) => ({ default: mod.LoansPage })),
)
const LoanDetailPage = lazy(() =>
  import('@/pages/LoansPage').then((mod) => ({ default: mod.LoanDetailPage })),
)
const OnboardingPage = lazy(() =>
  import('@/pages/OnboardingPage').then((mod) => ({ default: mod.OnboardingPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((mod) => ({ default: mod.ProfilePage })),
)
const StatementsPage = lazy(() =>
  import('@/pages/StatementsPage').then((mod) => ({ default: mod.StatementsPage })),
)
const WealthPage = lazy(() =>
  import('@/pages/WealthPage').then((mod) => ({ default: mod.WealthPage })),
)

function PageFallback() {
  return <LoadingScreen />
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-dvh place-items-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold">Something went wrong.</h1>
            <button
              className="mt-4 text-accent"
              onClick={() => window.location.reload()}
            >
              Reload the application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function ThemeSync({ children }: { children: ReactNode }) {
  const { settings } = useAuth()
  const theme: ThemeMode = settings?.theme ?? getStoredTheme() ?? 'light'

  useEffect(() => {
    applyThemeToDocument(theme)
    if (settings?.theme) persistTheme(settings.theme)
  }, [theme, settings?.theme])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeToDocument('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return children
}

function Guard({
  children,
  onboarding = false,
}: {
  children: ReactNode
  onboarding?: boolean
}) {
  const { user, profile, loading, configured } = useAuth()
  if (loading) return <LoadingScreen />
  if (!configured || !user) {
    if (onboarding) return <Navigate to="/login" replace />
    return <LoginPage />
  }
  if (!profile?.onboardingComplete && !onboarding)
    return <Navigate to="/onboarding" replace />
  if (profile?.onboardingComplete && onboarding) return <Navigate to="/" replace />
  return children
}

function Guest({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user && profile && !profile.onboardingComplete)
    return <Navigate to="/onboarding" replace />
  if (user && profile?.onboardingComplete) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeSync>
          <FinanceProvider>
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route
                    path="/login"
                    element={
                      <Guest>
                        <LoginPage />
                      </Guest>
                    }
                  />
                  <Route
                    path="/onboarding"
                    element={
                      <Guard onboarding>
                        <OnboardingPage />
                      </Guard>
                    }
                  />
                  <Route
                    element={
                      <Guard>
                        <AppTourProvider>
                          <AppShell />
                          <AppTourLayer />
                        </AppTourProvider>
                      </Guard>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="wealth" element={<WealthPage />} />
                    <Route path="wealth/:goalId" element={<GoalDetailPage />} />
                    <Route path="loans" element={<LoansPage />} />
                    <Route path="loans/:loanId" element={<LoanDetailPage />} />
                    <Route path="statements" element={<StatementsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <Toaster position="top-center" richColors />
          </FinanceProvider>
        </ThemeSync>
      </AuthProvider>
    </ErrorBoundary>
  )
}
