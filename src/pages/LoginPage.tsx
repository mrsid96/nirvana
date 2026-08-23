import { useState, type FormEvent } from 'react'
import { Landmark, Target, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { PwaInstallLink } from '@/components/PwaInstallLink'
import { NirvanaLoaderLogo } from '@/components/NirvanaLogo'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { isFirebaseConfigured } from '@/firebase/config'
import { cn } from '@/lib/utils'

const highlights = [
  {
    icon: Target,
    title: 'Wealth goals',
    text: 'Retirement, home, education — and whether you are ahead or behind.',
    tone: 'bg-accent/10 text-accent',
  },
  {
    icon: TrendingUp,
    title: 'Investments',
    text: 'Funds, FDs, stocks, gold and more, with gain or loss in one place.',
    tone: 'bg-mint/15 text-mint',
  },
  {
    icon: Landmark,
    title: 'Loans',
    text: 'Outstanding, EMI and how much principal you have already paid.',
    tone: 'bg-peach/15 text-peach',
  },
  {
    icon: Wallet,
    title: 'Monthly cash flow',
    text: 'Income, spend, invest, EMIs — then what is left this month.',
    tone: 'bg-sky/15 text-sky',
  },
] as const

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        opacity=".9"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        opacity=".75"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        opacity=".6"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        opacity=".8"
      />
    </svg>
  )
}

function SignInForm({
  busy,
  ready,
  onSignIn,
  className,
}: {
  busy: boolean
  ready: boolean
  onSignIn: (event: FormEvent) => void
  className?: string
}) {
  return (
    <form onSubmit={onSignIn} className={className}>
      <Button type="submit" className="w-full" size="lg" disabled={busy || !ready}>
        <GoogleMark />
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </Button>
      {!ready ? (
        <p className="mt-3 text-center text-sm text-warning">
          Add your Firebase environment variables to enable Google sign-in.
        </p>
      ) : null}
    </form>
  )
}

function PreviewCard({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden>
      <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-accent/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-mint/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-[24px] border border-ink/5 bg-surface p-5 shadow-[var(--shadow-soft)] dark:border-white/10 dark:bg-surface-dark">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          This month
        </p>
        <p className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink dark:text-white">
          Net ₹12.4L
        </p>
        <p className="mt-1 text-sm text-mint">Wealth up · loans down</p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Income', value: '₹1.8L', bar: 'bg-mint w-[86%]' },
            { label: 'Spend', value: '₹64k', bar: 'bg-peach w-[42%]' },
            { label: 'Invest', value: '₹45k', bar: 'bg-accent w-[58%]' },
          ].map((item) => (
            <div key={item.label} className="rounded-[16px] bg-canvas px-2 py-3 dark:bg-white/5">
              <div className="mx-auto mb-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
                <div className={cn('h-full rounded-full', item.bar)} />
              </div>
              <p className="text-[11px] text-ink-muted">{item.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[16px] bg-accent/8 px-4 py-3 dark:bg-accent/15">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink dark:text-white">Home fund</p>
              <p className="text-xs text-ink-muted">On track · 68%</p>
            </div>
            <span className="rounded-full bg-mint/20 px-2.5 py-1 text-[11px] font-semibold text-mint">
              Ahead
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
            <div className="h-full w-[68%] rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { signIn, configured } = useAuth()
  const [busy, setBusy] = useState(false)
  const ready = configured && isFirebaseConfigured()

  async function onSignIn(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await signIn()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-dvh max-w-[100vw] overflow-x-hidden bg-transparent">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col px-5 pb-36 pt-safe sm:px-8 lg:pb-16">
        <header className="flex flex-col items-center pt-6 text-center lg:hidden">
          <NirvanaLoaderLogo size="lg" />
        </header>

        <div className="mt-8 grid min-w-0 items-center gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="min-w-0">
            <h1 className="text-center font-serif text-[2.15rem] font-medium leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-left dark:text-white">
              Your money is <span className="italic">growing</span>.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-ink-muted sm:text-lg lg:mx-0 lg:text-left">
              One place for goals, investments, loans and monthly progress — so you can see the
              whole picture, not just the transactions.
            </p>

            <PreviewCard className="mt-8 min-w-0 lg:hidden" />

            <ul className="mt-8 grid min-w-0 gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li
                  key={item.title}
                  className="min-w-0 rounded-[20px] border border-ink/5 bg-surface/80 p-4 dark:border-white/10 dark:bg-surface-dark/80"
                >
                  <span className={cn('grid h-9 w-9 place-items-center rounded-[12px]', item.tone)}>
                    <item.icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink dark:text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-snug text-ink-muted">{item.text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8 hidden max-w-sm lg:block">
              <SignInForm busy={busy} ready={ready} onSignIn={onSignIn} />
              <div className="mt-5 flex justify-start">
                <PwaInstallLink />
              </div>
            </div>
          </div>

          <div className="hidden min-w-0 flex-col items-center lg:flex">
            <NirvanaLoaderLogo size="hero" className="h-[280px] w-[280px] xl:h-[320px] xl:w-[320px]" />
            <PreviewCard className="mt-6 w-full" />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/5 bg-canvas/90 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-canvas-dark/90 lg:hidden">
        <SignInForm busy={busy} ready={ready} onSignIn={onSignIn} />
        <div className="mt-3 flex justify-center">
          <PwaInstallLink />
        </div>
      </div>
    </div>
  )
}
