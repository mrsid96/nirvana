import { type ElementType, type FormEvent, type ReactNode } from 'react'
import {
  Ban,
  BarChart3,
  Building2,
  Coins,
  HeartPulse,
  IndianRupee,
  Landmark,
  Lock,
  MessageSquareText,
  PiggyBank,
  Receipt,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { HeroPreview } from '@/components/landing/HeroPreview'
import { NirvanaHorizontalLogo } from '@/components/NirvanaLogo'
import { PwaInstallLink } from '@/components/PwaInstallLink'

type CardTone = 'accent' | 'mint' | 'sky' | 'peach' | 'gold' | 'success'

const toneStyles: Record<
  CardTone,
  { badge: string; card: string; stat: string; ring: string }
> = {
  accent: {
    badge: 'bg-accent/15 text-accent ring-accent/25',
    card: 'from-accent/[0.14] via-surface to-accent/[0.04] dark:from-accent/20 dark:via-surface-dark',
    stat: 'text-accent',
    ring: 'border-accent/20',
  },
  mint: {
    badge: 'bg-mint/15 text-mint ring-mint/25',
    card: 'from-mint/[0.16] via-surface to-mint/[0.04] dark:from-mint/20 dark:via-surface-dark',
    stat: 'text-mint',
    ring: 'border-mint/20',
  },
  sky: {
    badge: 'bg-sky/15 text-sky ring-sky/25',
    card: 'from-sky/[0.16] via-surface to-sky/[0.04] dark:from-sky/20 dark:via-surface-dark',
    stat: 'text-sky',
    ring: 'border-sky/20',
  },
  peach: {
    badge: 'bg-peach/15 text-peach ring-peach/25',
    card: 'from-peach/[0.16] via-surface to-peach/[0.04] dark:from-peach/20 dark:via-surface-dark',
    stat: 'text-peach',
    ring: 'border-peach/20',
  },
  gold: {
    badge: 'bg-yellow/20 text-yellow-700 ring-yellow/30 dark:text-yellow-300',
    card: 'from-yellow/[0.18] via-surface to-yellow/[0.05] dark:from-yellow/15 dark:via-surface-dark',
    stat: 'text-yellow-700 dark:text-yellow-300',
    ring: 'border-yellow/25',
  },
  success: {
    badge: 'bg-success/15 text-success ring-success/25',
    card: 'from-success/[0.14] via-surface to-success/[0.04] dark:from-success/20 dark:via-surface-dark',
    stat: 'text-success',
    ring: 'border-success/20',
  },
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity=".9" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".75" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".6" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".8" />
    </svg>
  )
}

function IconBadge({
  icon: Icon,
  tone = 'accent',
  className,
}: {
  icon: ElementType<{ className?: string; strokeWidth?: number }>
  tone?: CardTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ring-1 ring-inset',
        toneStyles[tone].badge,
        className,
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
    </span>
  )
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
      <Coins className="h-3.5 w-3.5" strokeWidth={2.2} />
      {children}
    </p>
  )
}

function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'font-serif text-[1.75rem] font-medium leading-[1.15] tracking-tight text-ink sm:text-4xl dark:text-white',
        className,
      )}
    >
      {children}
    </h2>
  )
}

function MoneyFloaters() {
  const chips = ['₹', '$', '€', '₹42L', '+24%', 'SIP', 'EMI', '₹']
  return (
    <div className="landing-money-floaters pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {chips.map((chip, index) => (
        <span
          key={`${chip}-${index}`}
          className={cn(
            'landing-money-float absolute font-display text-sm font-bold',
            index % 3 === 0 && 'text-accent/20',
            index % 3 === 1 && 'text-mint/25',
            index % 3 === 2 && 'text-yellow/25',
          )}
          style={{
            top: `${8 + (index * 11) % 72}%`,
            left: `${4 + (index * 17) % 88}%`,
            animationDelay: `${index * 0.7}s`,
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  )
}

function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="landing-shell relative min-h-dvh bg-canvas text-ink dark:bg-canvas-dark dark:text-white">
      <div className="landing-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-glow landing-glow-a pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-glow landing-glow-b pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-glow landing-glow-c pointer-events-none absolute inset-0" aria-hidden />
      <MoneyFloaters />
      {children}
    </div>
  )
}

const heroStats = [
  { label: 'Net worth', value: '₹42.8L', tone: 'accent' as const },
  { label: 'Assets tracked', value: '₹60.8L', tone: 'mint' as const },
  { label: 'Monthly income', value: '₹3.8L', tone: 'gold' as const },
  { label: 'Free cash flow', value: '₹2.4L', tone: 'success' as const },
]

export function LandingNav({
  onSignIn,
  signInBusy,
  signInReady,
}: {
  onSignIn: (event: FormEvent) => void
  signInBusy: boolean
  signInReady: boolean
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-accent/10 bg-canvas/90 backdrop-blur-xl dark:border-accent/15 dark:bg-canvas-dark/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <NirvanaHorizontalLogo size="nav" />
        <form onSubmit={onSignIn}>
          <Button type="submit" variant="secondary" disabled={signInBusy || !signInReady}>
            <GoogleMark />
            {signInBusy ? 'Opening…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </header>
  )
}

export function LandingHero({
  onTryDemo,
  onSignIn,
  signInBusy,
  signInReady,
}: {
  onTryDemo: () => void
  onSignIn: (event: FormEvent) => void
  signInBusy: boolean
  signInReady: boolean
}) {
  return (
    <section className="relative px-5 pb-10 pt-24 sm:px-8 sm:pb-12 sm:pt-28 lg:pb-16 lg:pt-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <SectionEyebrow>Wealth tracker for real financial life</SectionEyebrow>

          <h1 className="hero-reveal hero-delay-1 mt-5 font-serif text-[2.35rem] font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.35rem] dark:text-white">
            Your money.{' '}
            <span className="hero-shimmer-text italic">One clear picture.</span>
          </h1>

          <p className="hero-reveal hero-delay-2 mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">
            Track income, expenses, investments, assets, liabilities and net worth — all in one
            vibrant dashboard built for real financial life.
          </p>

          <div className="hero-reveal hero-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              type="button"
              size="lg"
              className="w-full bg-gradient-to-r from-accent to-violet-600 shadow-[var(--shadow-fab)] sm:w-auto sm:min-w-[190px]"
              onClick={onTryDemo}
            >
              <IndianRupee className="h-5 w-5" strokeWidth={2.2} />
              Try Nirvana
            </Button>
            <form onSubmit={onSignIn} className="w-full sm:w-auto">
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="w-full border-accent/15 sm:min-w-[190px]"
                disabled={signInBusy || !signInReady}
              >
                <GoogleMark />
                Sign in
              </Button>
            </form>
          </div>

          {!signInReady ? (
            <p className="mt-3 text-sm text-warning">
              Add your Firebase environment variables to enable Google sign-in.
            </p>
          ) : null}

          <div className="hero-reveal hero-delay-4 mt-8 rounded-[20px] border border-mint/20 bg-gradient-to-r from-mint/10 via-surface/80 to-accent/8 p-4 text-left backdrop-blur-sm dark:from-mint/15 dark:via-surface-dark/80 lg:max-w-md">
            <div className="flex items-start gap-3">
              <IconBadge icon={Lock} tone="mint" className="h-10 w-10" />
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">Private by design</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  No bank password, UPI PIN, OTP or banking credentials required.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-reveal-scale hero-delay-5 relative mx-auto w-full max-w-[440px] lg:max-w-none">
          <div className="absolute -left-8 top-6 hidden h-32 w-32 rounded-full bg-gradient-to-br from-mint/30 to-success/10 blur-3xl lg:block" />
          <div className="absolute -right-6 bottom-4 hidden h-36 w-36 rounded-full bg-gradient-to-br from-accent/30 to-violet-500/10 blur-3xl lg:block" />
          <div className="absolute -right-2 top-20 hidden rounded-[18px] border border-yellow/25 bg-yellow/15 px-3 py-2 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">Bonus</p>
            <p className="font-display text-lg font-bold text-ink dark:text-white">₹2L</p>
          </div>
          <HeroPreview className="hero-float relative" />
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {heroStats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'rounded-[20px] border bg-gradient-to-br p-4 text-center sm:text-left',
              toneStyles[stat.tone].card,
              toneStyles[stat.tone].ring,
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{stat.label}</p>
            <p className={cn('font-display mt-1 text-2xl font-bold tabular-nums', toneStyles[stat.tone].stat)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

const capabilityCards = [
  {
    icon: BarChart3,
    tone: 'accent' as const,
    title: 'Dashboard',
    stat: '₹42.8L net position',
    text: 'Wealth, investments, loans, cash flow, and quick actions in one colourful snapshot.',
    span: 'lg:col-span-2',
  },
  {
    icon: Target,
    tone: 'mint' as const,
    title: 'Wealth goals',
    stat: '4 goals · 68% ahead',
    text: 'Retirement, emergency fund, education, home — ahead, on track, or behind at a glance.',
    span: '',
  },
  {
    icon: TrendingUp,
    tone: 'sky' as const,
    title: 'Investments',
    stat: '₹37.8L tracked',
    text: 'Mutual funds, stocks, EPF, FDs, gold, PPF, NPS, cash — allocation, gains, and SIPs.',
    span: '',
  },
  {
    icon: Landmark,
    tone: 'peach' as const,
    title: 'Loans',
    stat: '₹18L outstanding',
    text: 'Home loan EMIs, outstanding balances, payment history, and debt progress.',
    span: '',
  },
  {
    icon: Receipt,
    tone: 'gold' as const,
    title: 'Income & expenses',
    stat: '₹3.8L this month',
    text: 'Salary, bonus, spending, and monthly statements that feed your cash-flow view.',
    span: 'lg:col-span-2',
  },
  {
    icon: HeartPulse,
    tone: 'success' as const,
    title: 'Financial health',
    stat: '24% savings rate',
    text: 'Savings rate, investment rate, loan burden, and goal progress in one overview.',
    span: 'lg:col-span-2',
  },
]

export function LandingCapabilities() {
  return (
    <section className="border-y border-accent/10 bg-gradient-to-b from-accent/[0.06] via-surface/70 to-mint/[0.05] px-5 py-16 sm:px-8 dark:from-accent/10 dark:via-surface-dark/50 dark:to-mint/5">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>The complete financial picture</SectionEyebrow>
          <SectionTitle className="mt-4">
            Everything your money touches —{' '}
            <span className="text-accent">in one place</span>
          </SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Income, wealth, and debt connected with charts, goals, projections, and everyday
            tracking that takes seconds.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilityCards.map((item) => (
            <article
              key={item.title}
              className={cn(
                'landing-card group overflow-hidden rounded-[24px] border bg-gradient-to-br p-5 shadow-[var(--shadow-soft)]',
                toneStyles[item.tone].card,
                toneStyles[item.tone].ring,
                item.span,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <IconBadge icon={item.icon} tone={item.tone} />
                <span className={cn('font-display text-sm font-bold tabular-nums', toneStyles[item.tone].stat)}>
                  {item.stat}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const featureCards = [
  {
    icon: Wallet,
    tone: 'accent' as const,
    title: 'Net worth',
    stat: '₹42.8L',
    text: 'See assets minus liabilities in one headline number.',
  },
  {
    icon: TrendingUp,
    tone: 'mint' as const,
    title: 'Investments',
    stat: '+12% growth',
    text: 'Track SIPs, gains, allocation, and wealth growth over time.',
  },
  {
    icon: Building2,
    tone: 'sky' as const,
    title: 'Assets & liabilities',
    stat: '₹60.8L assets',
    text: 'Home, vehicle, mutual funds, and loans side by side.',
  },
  {
    icon: Receipt,
    tone: 'peach' as const,
    title: 'Income & expenses',
    stat: '₹41.5k spent',
    text: 'Salary in, spending out — know what remains each month.',
  },
  {
    icon: Target,
    tone: 'gold' as const,
    title: 'Financial goals',
    stat: '68% retirement',
    text: 'Ahead, on track, or behind — with projected future value.',
  },
  {
    icon: MessageSquareText,
    tone: 'success' as const,
    title: 'Natural language',
    stat: 'Type & go',
    text: 'Tell Nirvana what happened with your money in plain language.',
    examples: [
      'Invested ₹50,000 in HDFC Flexi Cap.',
      'Spent ₹25,000 on home interiors.',
      'Received ₹2 lakh bonus.',
    ],
  },
]

export function LandingFeatureShowcase() {
  const highlights = [
    { icon: Zap, label: 'Quick add', value: '5 sec', tone: 'accent' as const },
    { icon: PiggyBank, label: 'Savings rate', value: '24%', tone: 'mint' as const },
    { icon: IndianRupee, label: 'Free cash flow', value: '₹2.4L', tone: 'gold' as const },
    { icon: BarChart3, label: 'Wealth charts', value: 'Live', tone: 'sky' as const },
  ]

  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[28px] border border-accent/15 bg-gradient-to-br from-accent/10 via-surface to-mint/10 p-6 dark:from-accent/15 dark:via-surface-dark dark:to-mint/10 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <SectionEyebrow>Flaunt your finances</SectionEyebrow>
              <SectionTitle className="mt-4">
                Charts, goals, and <span className="text-mint">₹ numbers</span> that actually mean something
              </SectionTitle>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
                From net worth and asset allocation to monthly cash flow and loan progress — Nirvana
                turns scattered money into a picture you can act on.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-xl">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-[18px] border bg-surface/80 p-3 text-center dark:bg-surface-dark/80',
                    toneStyles[item.tone].ring,
                  )}
                >
                  <item.icon className={cn('mx-auto h-5 w-5', toneStyles[item.tone].stat)} strokeWidth={2} />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{item.label}</p>
                  <p className={cn('font-display mt-1 text-lg font-bold', toneStyles[item.tone].stat)}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((item) => (
            <article
              key={item.title}
              className={cn(
                'landing-card overflow-hidden rounded-[24px] border bg-gradient-to-br p-5',
                toneStyles[item.tone].card,
                toneStyles[item.tone].ring,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <IconBadge icon={item.icon} tone={item.tone} />
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
                    toneStyles[item.tone].badge,
                  )}
                >
                  {item.stat}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink dark:text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.text}</p>
              {'examples' in item && item.examples ? (
                <ul className="mt-4 space-y-2 border-t border-ink/5 pt-4 dark:border-white/8">
                  {item.examples.map((example) => (
                    <li key={example} className="flex items-start gap-2 text-sm text-ink-muted">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                      <span className="leading-relaxed">&ldquo;{example}&rdquo;</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const trustPoints = [
  {
    icon: Shield,
    tone: 'accent' as const,
    title: 'Protected',
    text: "Your data is transmitted securely and stored using Firebase's encrypted infrastructure.",
  },
  {
    icon: Ban,
    tone: 'peach' as const,
    title: 'No bank credentials',
    text: 'Nirvana does not require your bank password, UPI PIN, OTP or card credentials.',
  },
  {
    icon: Lock,
    tone: 'mint' as const,
    title: 'Private',
    text: 'Your financial information is protected by authentication and data-access controls.',
  },
  {
    icon: SlidersHorizontal,
    tone: 'sky' as const,
    title: "You're in control",
    text: 'You decide what to track and can clear your financial data whenever you choose.',
  },
]

const questions = [
  'How much money do I have?',
  'Where is my money going?',
  'How much am I investing?',
  'How much debt do I have?',
  'Are my goals on track?',
  'What will my wealth look like?',
]

export function LandingTrust() {
  return (
    <section className="border-y border-mint/10 bg-gradient-to-b from-mint/[0.05] via-canvas to-accent/[0.04] px-5 py-16 sm:px-8 dark:from-mint/10 dark:via-canvas-dark dark:to-accent/5">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
          <div>
            <SectionEyebrow>Trust & privacy</SectionEyebrow>
            <SectionTitle className="mt-4">Your financial data deserves your trust.</SectionTitle>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Build confidence before you share anything real — without exaggerated security claims
              or bank integrations.
            </p>

            <div className="mt-8 rounded-[24px] border border-accent/15 bg-gradient-to-br from-accent/8 to-mint/8 p-5 dark:from-accent/12 dark:to-mint/10">
              <p className="text-sm font-semibold text-ink dark:text-white">Questions Nirvana helps answer</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {questions.map((question) => (
                  <li
                    key={question}
                    className="flex items-start gap-2 rounded-[14px] bg-surface/70 px-3 py-2 text-sm leading-relaxed text-ink-muted dark:bg-surface-dark/70"
                  >
                    <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trustPoints.map((item) => (
              <article
                key={item.title}
                className={cn(
                  'landing-card rounded-[22px] border bg-gradient-to-br p-5',
                  toneStyles[item.tone].card,
                  toneStyles[item.tone].ring,
                )}
              >
                <IconBadge icon={item.icon} tone={item.tone} className="h-10 w-10" />
                <h3 className="mt-4 text-base font-semibold text-ink dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingFinalCta({ onTryDemo }: { onTryDemo: () => void }) {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="landing-card relative overflow-hidden rounded-[28px] border border-accent/20 bg-gradient-to-br from-accent via-violet-600 to-mint p-8 text-center text-white shadow-[0_24px_80px_rgba(102,87,232,0.35)] sm:p-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-yellow/20 blur-2xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
            Try before you use
          </p>
          <h2 className="relative mt-3 font-serif text-2xl font-medium sm:text-4xl">
            See your financial life in one place.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/85">
            Try Nirvana with sample data — no account required. Explore ₹42.8L net worth, goals,
            loans, and cash flow instantly.
          </p>
          <Button
            type="button"
            size="lg"
            className="relative mt-8 min-w-[190px] bg-white text-accent hover:bg-white/90"
            onClick={onTryDemo}
          >
            <IndianRupee className="h-5 w-5" strokeWidth={2.2} />
            Try Nirvana
          </Button>
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-accent/10 bg-gradient-to-r from-accent/[0.04] via-transparent to-mint/[0.04] px-5 py-10 text-center">
      <p className="font-serif text-lg text-ink dark:text-white">
        Track today. Plan tomorrow. <span className="text-accent">Build your future.</span>
      </p>
      <p className="mt-2 text-xs text-ink-faint">© {new Date().getFullYear()} Nirvana</p>
      <div className="mt-4 flex justify-center">
        <PwaInstallLink />
      </div>
    </footer>
  )
}

export { LandingShell }
