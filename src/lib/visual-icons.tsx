import type { RecurringActivityType } from '@/types/recurring'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  Calendar,
  Car,
  Clapperboard,
  Home,
  Landmark,
  PartyPopper,
  Pill,
  Plane,
  RefreshCw,
  Rocket,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Sprout,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
  Wallet,
  Zap,
} from 'lucide-react'

export const EXPENSE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  Food: UtensilsCrossed,
  Groceries: ShoppingCart,
  Transport: Car,
  Home: Home,
  Shopping: ShoppingBag,
  Travel: Plane,
  Entertainment: Clapperboard,
  Health: Pill,
  Education: BookOpen,
}

export const MILESTONE_ICONS = {
  celebrate: PartyPopper,
  rocket: Rocket,
  trophy: Trophy,
  sparkle: Sparkles,
  strength: Zap,
  seedling: Sprout,
  chart: TrendingUp,
  calendar: Calendar,
  repeat: RefreshCw,
} as const

export type MilestoneIconKey = keyof typeof MILESTONE_ICONS

export function getOccurrenceTypeIcon(type: RecurringActivityType): LucideIcon {
  switch (type) {
    case 'INVESTMENT':
      return TrendingUp
    case 'LOAN_PAYMENT':
      return Landmark
    case 'INCOME':
      return Wallet
    case 'EXPENSE':
      return Banknote
    default:
      return Calendar
  }
}

export function IconBadge({
  icon: Icon,
  className,
  size = 'md',
}: {
  icon: LucideIcon
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
    md: { box: 'h-12 w-12', icon: 'h-6 w-6' },
    lg: { box: 'h-14 w-14', icon: 'h-7 w-7' },
  }
  const s = sizes[size]
  return (
    <div
      className={`grid place-items-center rounded-full bg-accent/10 text-accent ${s.box} ${className ?? ''}`}
    >
      <Icon className={s.icon} strokeWidth={2} />
    </div>
  )
}

export function WarningBadge({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-danger ${className ?? ''}`}>
      <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
    </span>
  )
}

export function OccurrenceTypeLabel({
  type,
  name,
  className,
}: {
  type: RecurringActivityType
  name: string
  className?: string
}) {
  const Icon = getOccurrenceTypeIcon(type)
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} />
      <span>{name}</span>
    </span>
  )
}
