import { cn } from '@/lib/utils'

const LOGO_URL = '/nirvana-logo.png'
const LOGO_HORIZONTAL_URL = '/nirvana-logo-horizontal.png'
const APP_ICON_URL = '/icons/icon-512.png'

const logoSizes = {
  sm: 'h-14 w-auto',
  md: 'h-20 w-auto',
  lg: 'h-28 w-auto',
  hero: 'h-36 w-auto',
  display: 'h-[200px] min-h-[200px] w-auto',
} as const

const horizontalSizes = {
  sm: 'h-8 w-auto',
  md: 'h-10 w-auto',
  lg: 'h-12 w-auto',
  nav: 'h-9 w-auto',
  sidebar: 'h-auto w-full',
} as const

type LogoSize = keyof typeof logoSizes
type HorizontalSize = keyof typeof horizontalSizes

/** Nirvana brand mark — vertical stack (icon + wordmark + tagline) */
export function NirvanaLoaderLogo({
  className,
  size = 'hero',
}: {
  className?: string
  size?: LogoSize
}) {
  return (
    <img
      src={LOGO_URL}
      alt="Nirvana"
      className={cn('max-w-full object-contain', logoSizes[size], className)}
    />
  )
}

/** Horizontal logo — icon + wordmark side by side */
export function NirvanaHorizontalLogo({
  className,
  size = 'nav',
}: {
  className?: string
  size?: HorizontalSize
}) {
  return (
    <img
      src={LOGO_HORIZONTAL_URL}
      alt="Nirvana"
      className={cn('max-w-full object-contain', horizontalSizes[size], className)}
    />
  )
}

/** @deprecated Use NirvanaLoaderLogo */
export function NirvanaLogo({
  className,
  size = 'hero',
}: {
  className?: string
  size?: LogoSize
  variant?: 'loader' | 'sidebar'
}) {
  return <NirvanaLoaderLogo className={className} size={size} />
}

export function NirvanaAppIcon({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizes = {
    xs: 'h-7 w-7',
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  }
  return (
    <img
      src={APP_ICON_URL}
      alt="Nirvana"
      className={cn('max-w-full rounded-[22%] object-contain', sizes[size], className)}
    />
  )
}
