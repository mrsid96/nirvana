export const DEMO_STORAGE_KEY = 'nirvana-demo-mode'
export const DEMO_USER_ID = 'demo-user'

export const DEMO_PROFILE = {
  uid: DEMO_USER_ID,
  displayName: 'Demo User',
  email: 'demo@try.nirvana.app',
  country: 'IN',
  currency: 'INR' as const,
  onboardingComplete: true,
  hasCompletedOnboarding: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const DEMO_SETTINGS = {
  currency: 'INR' as const,
  country: 'IN',
  dashboardMonth: '', // filled at runtime
  theme: 'light' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}
