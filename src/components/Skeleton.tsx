import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[14px] bg-ink/8 dark:bg-white/10',
        className,
      )}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-7" aria-busy aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full max-w-sm" />
      </div>
      <Skeleton className="h-44 w-full rounded-[24px]" />
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-52 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-36 w-full rounded-[20px]" />
        <Skeleton className="h-36 w-full rounded-[20px]" />
      </div>
    </div>
  )
}

export function WealthSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading wealth">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-24 rounded-[14px]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-[24px] lg:h-[200px]" />
        <Skeleton className="hidden h-28 w-full rounded-[24px] lg:block lg:h-[200px]" />
      </div>
      <Skeleton className="h-11 w-full rounded-[14px]" />
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="aspect-square w-full rounded-[18px]" />
        <Skeleton className="aspect-square w-full rounded-[18px]" />
      </div>
    </div>
  )
}

export function GoalDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading goal">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16 rounded-[14px]" />
          <Skeleton className="h-9 w-16 rounded-[14px]" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-[20px]" />
        <Skeleton className="h-96 w-full rounded-[20px]" />
      </div>
      <Skeleton className="h-11 w-full rounded-[14px]" />
      <div className="space-y-3">
        <Skeleton className="h-40 w-full rounded-[20px]" />
        <Skeleton className="h-28 w-full rounded-[20px]" />
      </div>
    </div>
  )
}

export function PageShellSkeleton() {
  return (
    <div className="min-h-dvh bg-[#f8f7f3] px-5 pt-6 dark:bg-[#1c1a17]">
      <div className="mx-auto max-w-[390px] space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-[24px]" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
