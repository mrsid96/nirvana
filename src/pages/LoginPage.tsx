import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  BarChart3,
  LineChart,
  PiggyBank,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { PwaInstallLink } from '@/components/PwaInstallLink'
import { NirvanaLoaderLogo } from '@/components/NirvanaLogo'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { isFirebaseConfigured } from '@/firebase/config'
import { cn } from '@/lib/utils'

const capabilities = [
  {
    icon: BarChart3,
    title: 'Financial dashboard',
    text: 'Wealth, investments, loans, net position, and free cash flow — one snapshot.',
  },
  {
    icon: Target,
    title: 'Wealth goals',
    text: 'Retirement, home, education — see if you are ahead, on track, or behind.',
  },
  {
    icon: TrendingUp,
    title: 'Investments & assets',
    text: 'Mutual funds, FDs, stocks, gold — allocation, gains, and monthly SIPs.',
  },
  {
    icon: Wallet,
    title: 'Monthly cash flow',
    text: 'Income, spend, investments, EMIs — then what remains each month.',
  },
] as const

const insights = [
  { icon: PiggyBank, label: 'Savings rate' },
  { icon: LineChart, label: 'Wealth growth' },
  { icon: Target, label: 'Goal progress' },
] as const

const previewBars = [
  { label: 'Income', value: '₹1.8L', color: 'bg-mint', delay: 'hero-bar-delay-1' },
  { label: 'Spend', value: '₹64k', color: 'bg-peach', delay: 'hero-bar-delay-2' },
  { label: 'Invest', value: '₹45k', color: 'bg-accent', delay: 'hero-bar-delay-3' },
  { label: 'Left', value: '₹43k', color: 'bg-success', delay: 'hero-bar-delay-4' },
] as const

function useRevealOnScroll(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

function RevealOnScroll({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode
  className?: string
  delayMs?: number
}) {
  const { ref, visible } = useRevealOnScroll()

  return (
    <div
      ref={ref}
      className={cn('hero-reveal-on-scroll', visible && 'is-visible', className)}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}

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

function SignInCta({
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
    <div className={cn('flex w-full max-w-sm flex-col items-center', className)}>
      <form onSubmit={onSignIn} className="w-full">
        <Button type="submit" className="w-full shadow-[var(--shadow-fab)]" size="lg" disabled={busy || !ready}>
          <GoogleMark />
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </Button>
      </form>
      {!ready ? (
        <p className="mt-3 text-center text-sm text-warning">
          Add your Firebase environment variables to enable Google sign-in.
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-ink-faint">Free · No card required</p>
      )}
      <div className="mt-4">
        <PwaInstallLink />
      </div>
    </div>
  )
}

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-glow-center absolute left-1/2 top-0 h-[520px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="hero-glow-side absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-mint/10 blur-3xl" />
      <div className="hero-glow-side-delayed absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-accent/8 blur-3xl" />
    </div>
  )
}

function PreviewCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-ink/5 bg-surface p-5 shadow-[var(--shadow-soft)] dark:border-white/8 dark:bg-surface-dark',
        className,
      )}
      aria-hidden
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Net position
          </p>
          <p className="font-display mt-1 text-4xl font-semibold tracking-tight text-ink dark:text-white">
            ₹12.4L
          </p>
          <p className="mt-1 text-sm text-mint">Wealth up · loans down</p>
        </div>
        <div className="hero-reveal hero-delay-6 rounded-[16px] bg-accent/8 px-3 py-2 text-right dark:bg-accent/15">
          <p className="text-[10px] text-ink-muted">Home fund</p>
          <p className="text-sm font-semibold text-ink dark:text-white">68% · Ahead</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 text-center">
        {previewBars.map((item) => (
          <div key={item.label} className="rounded-[14px] bg-canvas px-2 py-2.5 dark:bg-white/5">
            <div className="mx-auto mb-2 h-1 w-8 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
              <div className={cn('h-full w-full rounded-full', item.color, 'hero-bar', item.delay)} />
            </div>
            <p className="text-[10px] text-ink-muted">{item.label}</p>
            <p className="mt-0.5 text-xs font-semibold text-ink dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {insights.map((item, index) => (
          <span
            key={item.label}
            className={cn(
              'hero-reveal inline-flex items-center gap-1.5 rounded-full border border-ink/6 bg-canvas/80 px-2.5 py-1 text-[11px] font-medium text-ink-muted dark:border-white/8 dark:bg-white/5',
              index === 0 && 'hero-delay-4',
              index === 1 && 'hero-delay-5',
              index === 2 && 'hero-delay-6',
            )}
          >
            <item.icon className="h-3 w-3 text-accent" strokeWidth={2.2} />
            {item.label}
          </span>
        ))}
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
    <div className="relative min-h-dvh max-w-[100vw] overflow-x-hidden">
      <HeroBackdrop />

      {/* —— Hero —— */}
      <section className="relative flex min-h-[min(100dvh,900px)] flex-col items-center justify-center px-5 pb-16 pt-safe text-center sm:px-8">
        <NirvanaLoaderLogo className="hero-reveal-scale h-[200px] min-h-[200px] w-auto max-w-[min(100%,420px)]" />

        <p className="hero-reveal hero-delay-1 mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Your money. Your goals. Your wealth journey.
        </p>

        <h1 className="hero-reveal hero-delay-2 mt-5 max-w-3xl font-serif text-[2.15rem] font-medium leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] dark:text-white">
          The complete picture of{' '}
          <span className="hero-shimmer-text italic">your wealth</span>.
        </h1>

        <p className="hero-reveal hero-delay-3 mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Wealth goals, investments, loans, income and expenses — brought together in one
          simple, visual experience. Know where your money goes, what you are building, and
          whether you are on track.
        </p>

        <SignInCta
          busy={busy}
          ready={ready}
          onSignIn={onSignIn}
          className="hero-reveal hero-delay-4 mt-10"
        />

        <PreviewCard className="hero-reveal-scale hero-delay-5 hero-float mt-14 lg:mt-16" />
      </section>

      {/* —— Capabilities —— */}
      <section className="relative border-t border-ink/5 bg-surface/50 px-5 py-14 sm:px-8 dark:border-white/8 dark:bg-surface-dark/30">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-ink-faint">
              Everything connected
            </p>
            <h2 className="mt-3 text-center font-serif text-2xl font-medium text-ink sm:text-3xl dark:text-white">
              Built for real financial life
            </h2>
          </RevealOnScroll>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:gap-5">
            {capabilities.map((item, index) => (
              <RevealOnScroll key={item.title} delayMs={index * 90}>
                <li className="group hero-card-lift rounded-[22px] border border-ink/5 bg-surface p-5 text-left shadow-[var(--shadow-soft)] hover:border-accent/15 dark:border-white/8 dark:bg-surface-dark">
                  <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink dark:text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.text}</p>
                </li>
              </RevealOnScroll>
            ))}
          </ul>

          <RevealOnScroll delayMs={120}>
            <p className="mt-12 text-center font-serif text-lg italic text-ink-muted">
              Track today. Plan tomorrow. Build your future.
            </p>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  )
}
