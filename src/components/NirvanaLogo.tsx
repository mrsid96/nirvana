import { cn } from '@/lib/utils'

const LOGO_URL = '/nirvana-logo.png'

const logoSizes = {
  sm: 'h-14 w-auto',
  md: 'h-20 w-auto',
  lg: 'h-28 w-auto',
  hero: 'h-36 w-auto',
  display: 'h-[200px] min-h-[200px] w-auto',
} as const

type LogoSize = keyof typeof logoSizes

/** Nirvana brand mark */
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
    xs: 'h-7 w-auto',
    sm: 'h-9 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-20 w-auto',
  }
  return (
    <img
      src={LOGO_URL}
      alt="Nirvana"
      className={cn('max-w-full object-contain', sizes[size], className)}
    />
  )
}
