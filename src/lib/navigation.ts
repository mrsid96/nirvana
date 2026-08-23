import { FileText, Home, Landmark, Sparkles } from 'lucide-react'

export const tabItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/wealth', label: 'Wealth', icon: Sparkles },
  { to: '/loans', label: 'Loans', icon: Landmark },
  { to: '/statements', label: 'Statements', icon: FileText },
] as const

export const tabTitles: Record<string, string> = {
  '/': 'Home',
  '/wealth': 'Wealth',
  '/loans': 'Loans',
  '/statements': 'Statements',
  '/profile': 'Profile',
}
