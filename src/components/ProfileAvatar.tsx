import { Link } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { firstName } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function ProfileAvatar({ className }: { className?: string }) {
  const { user, profile } = useAuth()
  const photoURL = user?.photoURL ?? profile?.photoURL
  const name = firstName(profile?.displayName ?? user?.displayName)

  return (
    <Link
      to="/profile"
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-ink/8 bg-surface shadow-[var(--shadow-soft)] transition-transform active:scale-95 dark:border-white/10 dark:bg-surface-dark',
        className,
      )}
      aria-label="Your profile"
    >
      {photoURL ? (
        <img src={photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-accent/10 text-sm font-semibold text-accent">
          {name.slice(0, 1).toUpperCase() || <UserRound className="h-4 w-4" />}
        </span>
      )}
    </Link>
  )
}
