export type ThemeMode = 'light' | 'dark' | 'system'
export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'AED'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  country: string
  currency: SupportedCurrency
  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  currency: SupportedCurrency
  country: string
  dashboardMonth: string
  theme: ThemeMode
  createdAt: string
  updatedAt: string
}
