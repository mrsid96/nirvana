import { type ElementType, type FormEvent, type ReactNode } from 'react'
import {
  Ban,
  BarChart3,
  Building2,
  HeartPulse,
  Landmark,
  Lock,
  MessageSquareText,
  Receipt,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { HeroPreview } from '@/components/landing/HeroPreview'
import { NirvanaLoaderLogo } from '@/components/NirvanaLogo'
import { PwaInstallLink } from '@/components/PwaInstallLink'

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

function IconBadge({
  icon: Icon,
  tone = 'accent',
  className,
}: {
  icon: ElementType<{ className?: string; strokeWidth?: number }>
  tone?: 'accent' | 'mint' | 'sky' | 'peach'
  className?: string
}) {
  const tones = {
    accent: 'bg-accent/10 text-accent ring-accent/15',
    mint: 'bg-mint/12 text-mint ring-mint/20',
    sky: 'bg-sky/12 text-sky ring-sky/20',
    peach: 'bg-peach/12 text-peach ring-peach/20',
  }

  return (
    <span
      className={cn(
        'grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
    </span>
  )
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{children}</p>
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

function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="landing-shell relative min-h-dvh bg-canvas text-ink dark:bg-canvas-dark dark:text-white">
      <div className="landing-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-glow landing-glow-a pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-glow landing-glow-b pointer-events-none absolute inset-0" aria-hidden />
      {children}
    </div>
  )
}

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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-ink/5 bg-canvas/85 backdrop-blur-xl dark:border-white/8 dark:bg-canvas-dark/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <NirvanaLoaderLogo size="sm" className="h-11 min-h-0 w-auto" />
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
    <section className="relative px-5 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <SectionEyebrow>Wealth tracker for real financial life</SectionEyebrow>

          <h1 className="hero-reveal hero-delay-1 mt-4 font-serif text-[2.35rem] font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.35rem] dark:text-white">
            Your money. One clear picture.
          </h1>

          <p className="hero-reveal hero-delay-2 mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">
            Track your income, expenses, investments, assets, liabilities and net worth — all in one
            simple place. Understand where your money goes, what you are building, and whether you
            are on track.
          </p>

          <div className="hero-reveal hero-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              type="button"
              size="lg"
              className="w-full shadow-[var(--shadow-fab)] sm:w-auto sm:min-w-[180px]"
              onClick={onTryDemo}
            >
              Try Nirvana
            </Button>
            <form onSubmit={onSignIn} className="w-full sm:w-auto">
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="w-full sm:min-w-[180px]"
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

          <div className="hero-reveal hero-delay-4 mt-8 rounded-[20px] border border-ink/6 bg-surface/70 p-4 text-left backdrop-blur-sm dark:border-white/8 dark:bg-surface-dark/70 lg:max-w-md">
            <div className="flex items-start gap-3">
              <IconBadge icon={Lock} tone="mint" className="h-10 w-10" />
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">Private by design</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  Your financial data belongs to you. Nirvana doesn&apos;t require your bank password,
                  UPI PIN, OTP or banking credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-reveal-scale hero-delay-5 relative mx-auto w-full max-w-[440px] lg:max-w-none">
          <div className="absolute -left-6 top-8 hidden h-28 w-28 rounded-full bg-mint/15 blur-3xl lg:block" />
          <div className="absolute -right-4 bottom-6 hidden h-32 w-32 rounded-full bg-accent/15 blur-3xl lg:block" />
          <HeroPreview className="hero-float relative" />
        </div>
      </div>
    </section>
  )
}

const capabilityCards = [
  {
    icon: BarChart3,
    tone: 'accent' as const,
    title: 'Dashboard',
    text: 'Total wealth, investments, loans, net position, monthly cash flow, and quick actions in one snapshot.',
    span: 'lg:col-span-2',
  },
  {
    icon: Target,
    tone: 'mint' as const,
    title: 'Wealth goals',
    text: 'Retirement, emergency fund, education, home, and custom goals with ahead / on track / behind status.',
    span: '',
  },
  {
    icon: TrendingUp,
    tone: 'sky' as const,
    title: 'Investments & assets',
    text: 'Mutual funds, FDs, stocks, gold, PPF, NPS, cash and more — with allocation, gains, and SIP planning.',
    span: '',
  },
  {
    icon: Landmark,
    tone: 'peach' as const,
    title: 'Loans & payments',
    text: 'Track EMIs, outstanding balances, payment history, and overall debt progress in one place.',
    span: '',
  },
  {
    icon: Receipt,
    tone: 'accent' as const,
    title: 'Income & expenses',
    text: 'Salary, bonus, everyday spending, and monthly statements that roll into your cash-flow view.',
    span: 'lg:col-span-2',
  },
  {
    icon: HeartPulse,
    tone: 'mint' as const,
    title: 'Financial health',
    text: 'Savings rate, investment rate, loan burden, and goal progress in an easy-to-read overview.',
    span: 'lg:col-span-2',
  },
]

export function LandingCapabilities() {
  return (
    <section className="border-y border-ink/5 bg-surface/55 px-5 py-16 sm:px-8 dark:border-white/8 dark:bg-surface-dark/35">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>The complete financial picture</SectionEyebrow>
          <SectionTitle className="mt-3">
            Built for wealth goals, investments, loans, and everyday money
          </SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Wealth Tracker brings income, wealth, and debt together so you can answer the questions
            that matter most about your financial life.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilityCards.map((item) => (
            <article
              key={item.title}
              className={cn(
                'landing-card group rounded-[24px] border border-ink/6 bg-surface p-5 shadow-[var(--shadow-soft)] dark:border-white/8 dark:bg-surface-dark',
                item.span,
              )}
            >
              <IconBadge icon={item.icon} tone={item.tone} />
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
    text: 'See your complete financial position in one place.',
  },
  {
    icon: TrendingUp,
    tone: 'mint' as const,
    title: 'Investments',
    text: 'Track your investments and understand how your wealth is growing.',
  },
  {
    icon: Building2,
    tone: 'sky' as const,
    title: 'Assets & liabilities',
    text: 'Keep track of assets such as your home, vehicle and other property alongside loans and liabilities.',
  },
  {
    icon: Receipt,
    tone: 'peach' as const,
    title: 'Income & expenses',
    text: 'Understand where your money comes from and where it goes.',
  },
  {
    icon: Target,
    tone: 'accent' as const,
    title: 'Financial goals',
    text: 'Track progress toward important financial goals.',
  },
  {
    icon: MessageSquareText,
    tone: 'mint' as const,
    title: 'Natural language',
    text: 'Tell Nirvana what happened with your money in simple language.',
    examples: [
      'Invested ₹50,000 in HDFC Flexi Cap.',
      'Spent ₹25,000 on home interiors.',
      'Received ₹2 lakh bonus.',
    ],
  },
]

export function LandingFeatures() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Explore before you sign up</SectionEyebrow>
          <SectionTitle className="mt-3">Everything you need to understand your finances</SectionTitle>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((item) => (
            <article
              key={item.title}
              className="landing-card rounded-[24px] border border-ink/6 bg-surface/80 p-5 backdrop-blur-sm dark:border-white/8 dark:bg-surface-dark/80"
            >
              <div className="flex items-start gap-4">
                <IconBadge icon={item.icon} tone={item.tone} />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-ink dark:text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.text}</p>
                </div>
              </div>
              {'examples' in item && item.examples ? (
                <ul className="mt-4 space-y-2 border-t border-ink/5 pt-4 dark:border-white/8">
                  {item.examples.map((example) => (
                    <li
                      key={example}
                      className="flex items-start gap-2 text-sm text-ink-muted"
                    >
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
    title: 'No bank credentials required',
    text: 'Nirvana does not require your bank password, UPI PIN, OTP or card credentials.',
  },
  {
    icon: Lock,
    tone: 'mint' as const,
    title: 'Private',
    text: "Your financial information is associated with your account and protected by the application's authentication and data-access controls.",
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
  'What will my wealth potentially look like in the future?',
]

export function LandingTrust() {
  return (
    <section className="border-y border-ink/5 bg-surface/55 px-5 py-16 sm:px-8 dark:border-white/8 dark:bg-surface-dark/35">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
          <div>
            <SectionEyebrow>Trust & privacy</SectionEyebrow>
            <SectionTitle className="mt-3">Your financial data deserves your trust.</SectionTitle>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Build confidence before you share anything real. Nirvana is designed to help you
              understand your finances without exaggerated security claims or bank integrations.
            </p>

            <div className="mt-8 rounded-[24px] border border-ink/6 bg-canvas/70 p-5 dark:border-white/8 dark:bg-white/5">
              <p className="text-sm font-semibold text-ink dark:text-white">Questions Nirvana helps answer</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {questions.map((question) => (
                  <li
                    key={question}
                    className="flex items-start gap-2 text-sm leading-relaxed text-ink-muted"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
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
                className="landing-card rounded-[22px] border border-ink/6 bg-surface p-5 dark:border-white/8 dark:bg-surface-dark"
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
        <div className="landing-card overflow-hidden rounded-[28px] border border-accent/15 bg-gradient-to-br from-accent/[0.08] via-surface to-mint/[0.08] p-8 text-center shadow-[var(--shadow-soft)] dark:from-accent/15 dark:via-surface-dark dark:to-mint/10 sm:p-10">
          <SectionEyebrow>Try before you use</SectionEyebrow>
          <SectionTitle className="mt-3">See your financial life in one place.</SectionTitle>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            Try Nirvana with sample data — no account required. Track today. Plan tomorrow. Build
            your future.
          </p>
          <Button
            type="button"
            size="lg"
            className="mt-8 min-w-[180px] shadow-[var(--shadow-fab)]"
            onClick={onTryDemo}
          >
            Try Nirvana
          </Button>
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-ink/5 px-5 py-10 text-center dark:border-white/8">
      <p className="font-serif text-lg text-ink dark:text-white">Track today. Plan tomorrow. Build your future.</p>
      <p className="mt-2 text-xs text-ink-faint">© {new Date().getFullYear()} Nirvana</p>
      <div className="mt-4 flex justify-center">
        <PwaInstallLink />
      </div>
    </footer>
  )
}

export { LandingShell }
