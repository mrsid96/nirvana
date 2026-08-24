import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_PROFILE, DEMO_SETTINGS, DEMO_STORAGE_KEY } from '@/demo/constants'
import { useAuth } from '@/contexts/AuthContext'
import { currentMonthKey } from '@/lib/formatters/dates'
import type { SupportedCurrency, ThemeMode, UserProfile, UserSettings } from '@/types/user'

interface DemoContextValue {
  isDemoMode: boolean
  demoProfile: UserProfile
  demoSettings: UserSettings
  enterDemoMode: () => void
  exitDemoMode: () => void
  promptSignup: () => Promise<void>
}

const DemoContext = createContext<DemoContextValue | null>(null)

function readDemoModeFromStorage(): boolean {
  try {
    return sessionStorage.getItem(DEMO_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function buildDemoProfile(): UserProfile {
  return {
    ...DEMO_PROFILE,
    updatedAt: new Date().toISOString(),
  }
}

function buildDemoSettings(): UserSettings {
  return {
    ...DEMO_SETTINGS,
    dashboardMonth: currentMonthKey(),
    updatedAt: new Date().toISOString(),
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const { signIn } = useAuth()
  const [isDemoMode, setIsDemoMode] = useState(readDemoModeFromStorage)

  const demoProfile = useMemo(() => buildDemoProfile(), [isDemoMode])
  const demoSettings = useMemo(() => buildDemoSettings(), [isDemoMode])

  const enterDemoMode = useCallback(() => {
    try {
      sessionStorage.setItem(DEMO_STORAGE_KEY, '1')
    } catch {
      /* ignore storage errors */
    }
    setIsDemoMode(true)
  }, [])

  const exitDemoMode = useCallback(() => {
    try {
      sessionStorage.removeItem(DEMO_STORAGE_KEY)
    } catch {
      /* ignore storage errors */
    }
    setIsDemoMode(false)
  }, [])

  const promptSignup = useCallback(async () => {
    exitDemoMode()
    try {
      await signIn()
    } catch {
      /* user can retry from login page */
    }
  }, [exitDemoMode, signIn])

  const value = useMemo<DemoContextValue>(
    () => ({
      isDemoMode,
      demoProfile,
      demoSettings,
      enterDemoMode,
      exitDemoMode,
      promptSignup,
    }),
    [isDemoMode, demoProfile, demoSettings, enterDemoMode, exitDemoMode, promptSignup],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo(): DemoContextValue {
  const value = useContext(DemoContext)
  if (!value) throw new Error('useDemo must be used within DemoProvider')
  return value
}

export function useOptionalDemo(): DemoContextValue | null {
  return useContext(DemoContext)
}

/** Auth values with demo profile/settings when exploring without an account. */
export function useEffectiveAuth() {
  const auth = useAuth()
  const demo = useOptionalDemo()

  if (demo?.isDemoMode) {
    return {
      ...auth,
      user: null,
      profile: demo.demoProfile,
      settings: demo.demoSettings,
      isDemoMode: true as const,
      promptSignup: demo.promptSignup,
      exitDemoMode: demo.exitDemoMode,
    }
  }

  return {
    ...auth,
    isDemoMode: false as const,
    promptSignup: undefined,
    exitDemoMode: undefined,
  }
}

export function useEffectiveCurrency(): SupportedCurrency {
  return useEffectiveAuth().profile?.currency ?? 'INR'
}

export function useEffectiveTheme(): ThemeMode {
  return useEffectiveAuth().settings?.theme ?? 'light'
}
