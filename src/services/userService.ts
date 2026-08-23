import type { User } from 'firebase/auth'
import { paths } from '@/firebase/paths'
import { getDocument, nowIso, stamp, toIso, upsert, patch, touch } from '@/firebase/firestore'
import { currentMonthKey } from '@/lib/formatters/dates'
import type { UserProfile, UserSettings, SupportedCurrency, ThemeMode } from '@/types/user'

function mapProfile(raw: Record<string, unknown>, uid: string, fallback?: User): UserProfile {
  return {
    uid,
    displayName: String(raw.displayName ?? fallback?.displayName ?? 'there'),
    email: String(raw.email ?? fallback?.email ?? ''),
    photoURL: (raw.photoURL as string | undefined) ?? fallback?.photoURL ?? undefined,
    country: String(raw.country ?? 'IN'),
    currency: (raw.currency as SupportedCurrency) ?? 'INR',
    onboardingComplete: Boolean(raw.onboardingComplete),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const existing = await getDocument<Record<string, unknown>>(paths.user(user.uid))
  if (existing) {
    const profile = mapProfile(existing, user.uid, user)
    if (
      profile.displayName !== user.displayName ||
      profile.email !== user.email ||
      profile.photoURL !== (user.photoURL ?? undefined)
    ) {
      await patch(paths.user(user.uid), {
        displayName: user.displayName ?? profile.displayName,
        email: user.email ?? profile.email,
        photoURL: user.photoURL ?? profile.photoURL ?? null,
        ...touch(),
      })
    }
    return {
      ...profile,
      displayName: user.displayName ?? profile.displayName,
      email: user.email ?? profile.email,
      photoURL: user.photoURL ?? profile.photoURL,
    }
  }

  const createdAt = nowIso()
  await upsert(paths.user(user.uid), {
    uid: user.uid,
    displayName: user.displayName ?? 'there',
    email: user.email ?? '',
    photoURL: user.photoURL ?? null,
    country: 'IN',
    currency: 'INR',
    onboardingComplete: false,
    ...stamp(),
  })
  await upsert(paths.settings(user.uid), {
    currency: 'INR',
    country: 'IN',
    dashboardMonth: currentMonthKey(),
    theme: 'light',
    ...stamp(),
  })
  return {
    uid: user.uid,
    displayName: user.displayName ?? 'there',
    email: user.email ?? '',
    photoURL: user.photoURL ?? undefined,
    country: 'IN',
    currency: 'INR',
    onboardingComplete: false,
    createdAt,
    updatedAt: createdAt,
  }
}

export async function getSettings(uid: string): Promise<UserSettings | null> {
  const raw = await getDocument<Record<string, unknown>>(paths.settings(uid))
  if (!raw) return null
  return {
    currency: (raw.currency as SupportedCurrency) ?? 'INR',
    country: String(raw.country ?? 'IN'),
    dashboardMonth: String(raw.dashboardMonth ?? currentMonthKey()),
    theme: (raw.theme as ThemeMode) ?? 'light',
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  }
}

export async function updateSettings(
  uid: string,
  data: Partial<Pick<UserSettings, 'currency' | 'country' | 'dashboardMonth' | 'theme'>>,
): Promise<void> {
  await upsert(paths.settings(uid), { ...data, ...touch() })
  if (data.currency || data.country) {
    await patch(paths.user(uid), {
      ...(data.currency ? { currency: data.currency } : {}),
      ...(data.country ? { country: data.country } : {}),
      ...touch(),
    })
  }
}

export async function completeOnboarding(
  uid: string,
  data: { country: string; currency: SupportedCurrency },
): Promise<void> {
  await patch(paths.user(uid), {
    country: data.country,
    currency: data.currency,
    onboardingComplete: true,
    ...touch(),
  })
  await updateSettings(uid, data)
}
