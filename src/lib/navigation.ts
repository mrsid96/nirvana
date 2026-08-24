import { FileText, Home, Landmark, Sparkles } from 'lucide-react'

export const tabItems = [
  { to: '/', label: 'Home', icon: Home, tourId: 'dashboard' as const },
  { to: '/wealth', label: 'Wealth', icon: Sparkles, tourId: 'wealth' as const },
  { to: '/loans', label: 'Loans', icon: Landmark, tourId: 'loans' as const },
  { to: '/statements', label: 'Statements', icon: FileText },
] as const

export const tabTitles: Record<string, string> = {
  '/': 'Home',
  '/wealth': 'Wealth',
  '/loans': 'Loans',
  '/statements': 'Statements',
  '/profile': 'Profile',
}
