import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { subscribeToAuth, signInWithGoogle, signOut } from '@/firebase/auth'
import { isFirebaseConfigured } from '@/firebase/config'
import { completeOnboarding, completeAppTour, ensureUserProfile, getSettings, updateSettings } from '@/services/userService'
import { CURRENT_ONBOARDING_VERSION } from '@/lib/app-tour'
import { applyThemeToDocument, getStoredTheme, persistTheme } from '@/lib/theme'
import { logDevError, toUserMessage } from '@/lib/errors'
import type { SupportedCurrency, ThemeMode, UserProfile, UserSettings } from '@/types/user'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  settings: UserSettings | null
  loading: boolean
  configured: boolean
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
  finishOnboarding: (country: string, currency: SupportedCurrency) => Promise<void>
  markAppTourComplete: () => Promise<void>
  saveSettings: (
    data: Partial<Pick<UserSettings, 'currency' | 'country' | 'dashboardMonth' | 'theme'>>,
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const configured = isFirebaseConfigured()

  useEffect(() => {
    return subscribeToAuth(async (next) => {
      setUser(next)
      if (!next) {
        setProfile(null)
        setSettings(null)
        setLoading(false)
        return
      }
      try {
        const nextProfile = await ensureUserProfile(next)
        const nextSettings = await getSettings(next.uid)
        setProfile(nextProfile)
        setSettings(nextSettings)
        if (nextSettings?.theme) {
          persistTheme(nextSettings.theme)
          applyThemeToDocument(nextSettings.theme)
        }
      } catch (error) {
        logDevError(error)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      settings,
      loading,
      configured,
      signIn: async () => {
        try {
          await signInWithGoogle()
        } catch (error) {
          throw new Error(toUserMessage(error))
        }
      },
      signOutUser: () => signOut(),
      finishOnboarding: async (country, currency) => {
        if (!user) return
        await completeOnboarding(user.uid, { country, currency })
        setProfile((current) =>
          current ? { ...current, country, currency, onboardingComplete: true } : current,
        )
        setSettings((current) => (current ? { ...current, country, currency } : current))
      },
      markAppTourComplete: async () => {
        if (!user) return
        const completedAt = new Date().toISOString()
        await completeAppTour(user.uid)
        setProfile((current) =>
          current
            ? {
                ...current,
                hasCompletedOnboarding: true,
                onboardingVersion: CURRENT_ONBOARDING_VERSION,
                onboardingCompletedAt: completedAt,
              }
            : current,
        )
      },
      saveSettings: async (data) => {
        if (!user) return
        await updateSettings(user.uid, data)
        setSettings((current) => (current ? { ...current, ...data } : current))
        if (data.theme) {
          persistTheme(data.theme)
          applyThemeToDocument(data.theme)
        }
        if (data.currency || data.country) {
          setProfile((current) =>
            current
              ? {
                  ...current,
                  currency: data.currency ?? current.currency,
                  country: data.country ?? current.country,
                }
              : current,
          )
        }
      },
    }),
    [user, profile, settings, loading, configured],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}

export function useThemeMode(): ThemeMode {
  return useAuth().settings?.theme ?? getStoredTheme() ?? 'light'
}
