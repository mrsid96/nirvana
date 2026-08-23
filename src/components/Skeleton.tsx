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
      <Skeleton className="h-28 w-full rounded-[24px]" />
      <Skeleton className="h-11 w-full rounded-[14px]" />
      <div className="space-y-3">
        <Skeleton className="h-40 w-full rounded-[20px]" />
        <Skeleton className="h-40 w-full rounded-[20px]" />
      </div>
    </div>
  )
}

export function GoalDetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy aria-label="Loading goal">
      <Skeleton className="mx-auto h-52 w-52 rounded-full" />
      <Skeleton className="h-32 w-full rounded-[20px]" />
      <Skeleton className="h-24 w-full rounded-[20px]" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-28 w-full rounded-[20px]" />
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
