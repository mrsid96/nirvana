import { Home, Landmark, Sparkles, UserRound } from 'lucide-react'

export const tabItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/wealth', label: 'Wealth', icon: Sparkles },
  { to: '/loans', label: 'Loans', icon: Landmark },
  { to: '/profile', label: 'You', icon: UserRound },
] as const

export const tabTitles: Record<string, string> = {
  '/': 'Home',
  '/wealth': 'Wealth',
  '/loans': 'Loans',
  '/profile': 'You',
}
