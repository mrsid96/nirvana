import { cn } from '@/lib/utils'

const LOGO_URL = '/nirvana-loader.png'

const loaderSizes = {
  sm: 'h-24 w-24',
  md: 'h-32 w-32',
  lg: 'h-40 w-40',
  hero: 'h-[200px] w-[200px]',
} as const

type LoaderSize = keyof typeof loaderSizes

/** Nirvana mark — CSS background only */
export function NirvanaLoaderLogo({
  className,
  size = 'hero',
}: {
  className?: string
  size?: LoaderSize
}) {
  return (
    <div
      role="img"
      aria-label="Nirvana"
      className={cn(
        'bg-contain bg-center bg-no-repeat',
        loaderSizes[size],
        className,
      )}
      style={{ backgroundImage: `url("${LOGO_URL}")` }}
    />
  )
}

/** @deprecated Use NirvanaLoaderLogo */
export function NirvanaLogo({
  className,
  size = 'hero',
}: {
  className?: string
  size?: LoaderSize
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
    <div
      role="img"
      aria-label="Nirvana"
      className={cn('bg-contain bg-center bg-no-repeat', sizes[size], className)}
      style={{ backgroundImage: `url("${LOGO_URL}")` }}
    />
  )
}
