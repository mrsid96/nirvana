import { cn } from '@/lib/utils'

const loaderSizes = {
  sm: 'h-24 w-24',
  md: 'h-32 w-32',
  lg: 'h-40 w-40',
  hero: 'h-[200px] w-[200px]',
} as const

const sidebarSizes = {
  sm: 'h-8 w-[120px]',
  md: 'h-9 w-[140px]',
  lg: 'h-10 w-[160px]',
} as const

type LoaderSize = keyof typeof loaderSizes
type SidebarSize = keyof typeof sidebarSizes

/** Square loader / login mark — CSS background only */
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
        'bg-[url("/nirvana-loader.png")] bg-contain bg-center bg-no-repeat',
        loaderSizes[size],
        className,
      )}
    />
  )
}

/** Horizontal sidebar wordmark — CSS background only */
export function NirvanaSidebarLogo({
  className,
  size = 'md',
}: {
  className?: string
  size?: SidebarSize
}) {
  return (
    <div
      role="img"
      aria-label="Nirvana"
      className={cn(
        'bg-[url("/nirvana-sidebar.png")] bg-contain bg-left bg-no-repeat',
        sidebarSizes[size],
        className,
      )}
    />
  )
}

/** @deprecated Use NirvanaLoaderLogo or NirvanaSidebarLogo */
export function NirvanaLogo({
  className,
  size = 'md',
  variant = 'loader',
}: {
  className?: string
  size?: LoaderSize | SidebarSize
  variant?: 'loader' | 'sidebar'
}) {
  if (variant === 'sidebar') {
    return (
      <NirvanaSidebarLogo
        className={className}
        size={(size as SidebarSize) in sidebarSizes ? (size as SidebarSize) : 'md'}
      />
    )
  }
  return (
    <NirvanaLoaderLogo
      className={className}
      size={(size as LoaderSize) in loaderSizes ? (size as LoaderSize) : 'hero'}
    />
  )
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
      className={cn(
        'bg-[url("/icons/icon-192.png")] bg-contain bg-center bg-no-repeat',
        sizes[size],
        className,
      )}
    />
  )
}
