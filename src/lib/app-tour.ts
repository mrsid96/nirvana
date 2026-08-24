export const CURRENT_ONBOARDING_VERSION = 1

export type TourTargetId =
  | 'dashboard'
  | 'wealth'
  | 'loans'
  | 'profile'
  | 'fab'
  | 'notifications'

export interface TourStep {
  id: TourTargetId
  title: string
  description: string
  route?: string
  dashboardTab?: 'month' | 'notifications'
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Your financial home 🏠',
    description:
      'The Dashboard gives you a quick view of your financial life — cash flow, investments, loans, goals and important financial actions.',
    route: '/',
  },
  {
    id: 'wealth',
    title: 'Build your wealth 🎯',
    description: 'Create financial goals and track the investments helping you reach them.',
    route: '/',
  },
  {
    id: 'loans',
    title: 'Stay on top of your debt 🏦',
    description: 'Track your loans, EMIs, outstanding balances and repayment progress.',
    route: '/',
  },
  {
    id: 'profile',
    title: 'Make Nirvana yours 👤',
    description: 'Manage your profile, country, currency and app preferences here.',
    route: '/',
  },
  {
    id: 'fab',
    title: 'Add things in seconds ⚡',
    description:
      'Use the + button whenever you want to record something. Quickly add an expense, income, investment, withdrawal or loan payment.',
    route: '/',
  },
  {
    id: 'notifications',
    title: 'Never miss a financial commitment 🔔',
    description:
      'Nirvana keeps track of scheduled investments, EMIs and other recurring activities. When something is due, you\'ll see it here and can confirm whether it actually happened.',
    route: '/',
    dashboardTab: 'notifications',
  },
]

export function shouldAutoStartAppTour(
  hasCompletedOnboarding: boolean | undefined,
  onboardingVersion: number | undefined,
): boolean {
  if (hasCompletedOnboarding === false) return true
  if (hasCompletedOnboarding === true) {
    return (onboardingVersion ?? 0) < CURRENT_ONBOARDING_VERSION
  }
  return false
}

export function findVisibleTourTarget(targetId: TourTargetId): Element | null {
  const elements = document.querySelectorAll(`[data-tour="${targetId}"]`)
  for (const element of elements) {
    if (!isElementVisible(element)) continue
    return element
  }
  return null
}

export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return false
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false
  }
  return true
}

export async function scrollTourTargetIntoView(element: Element): Promise<void> {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({
    block: 'center',
    inline: 'center',
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  })
  await waitForLayout(prefersReducedMotion ? 50 : 350)
}

export function waitForLayout(ms = 100): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, ms)
    })
  })
}

export interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

export function getSpotlightRect(element: Element, padding = 8): SpotlightRect {
  const rect = element.getBoundingClientRect()
  return {
    top: Math.max(0, rect.top - padding),
    left: Math.max(0, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

export type TooltipPlacement = 'top' | 'bottom'

export interface TooltipPosition {
  top: number
  left: number
  placement: TooltipPlacement
  maxWidth: number
}

export function computeTooltipPosition(
  spotlight: SpotlightRect,
  tooltipWidth: number,
  tooltipHeight: number,
  gap = 12,
): TooltipPosition {
  const viewportPadding = 16
  const maxWidth = Math.min(tooltipWidth, window.innerWidth - viewportPadding * 2)
  const spaceAbove = spotlight.top - viewportPadding
  const spaceBelow = window.innerHeight - spotlight.top - spotlight.height - viewportPadding
  const placement: TooltipPlacement =
    spaceBelow >= tooltipHeight + gap || spaceBelow >= spaceAbove ? 'bottom' : 'top'

  const centerX = spotlight.left + spotlight.width / 2
  let left = centerX - maxWidth / 2
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - maxWidth - viewportPadding))

  const top =
    placement === 'bottom'
      ? spotlight.top + spotlight.height + gap
      : spotlight.top - tooltipHeight - gap

  return { top, left, placement, maxWidth }
}
