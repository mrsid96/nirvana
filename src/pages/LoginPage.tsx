<<<<<<< HEAD
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  LandingCapabilities,
  LandingFeatureShowcase,
  LandingFinalCta,
  LandingFooter,
  LandingHero,
  LandingNav,
  LandingShell,
  LandingTrust,
} from '@/components/landing/LandingSections'
import { useAuth } from '@/contexts/AuthContext'
import { useDemo } from '@/contexts/DemoContext'
import { isFirebaseConfigured } from '@/firebase/config'
=======
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { NirvanaLoaderLogo } from '@/components/NirvanaLogo'
import { PwaInstallLink } from '@/components/PwaInstallLink'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useDemo } from '@/contexts/DemoContext'
import { isFirebaseConfigured } from '@/firebase/config'
import { cn } from '@/lib/utils'

const features = [
  {
    emoji: '💰',
    title: 'Net Worth',
    text: 'See your complete financial position in one place.',
  },
  {
    emoji: '📈',
    title: 'Investments',
    text: 'Track your investments and understand how your wealth is growing.',
  },
  {
    emoji: '🏠',
    title: 'Assets & Liabilities',
    text: 'Keep track of assets such as your home, vehicle and other property alongside loans and liabilities.',
  },
  {
    emoji: '💳',
    title: 'Income & Expenses',
    text: 'Understand where your money comes from and where it goes.',
  },
  {
    emoji: '🎯',
    title: 'Financial Goals',
    text: 'Track progress toward important financial goals.',
  },
  {
    emoji: '✍️',
    title: 'Natural Language',
    text: 'Tell Nirvana what happened with your money in simple language.',
    examples: [
      'Invested ₹50,000 in HDFC Flexi Cap.',
      'Spent ₹25,000 on home interiors.',
      'Received ₹2 lakh bonus.',
    ],
  },
] as const

const trustPoints = [
  {
    emoji: '🔐',
    title: 'Protected',
    text: "Your data is transmitted securely and stored using Firebase's encrypted infrastructure.",
  },
  {
    emoji: '🚫',
    title: 'No bank credentials required',
    text: 'Nirvana does not require your bank password, UPI PIN, OTP or card credentials.',
  },
  {
    emoji: '👤',
    title: 'Private',
    text: "Your financial information is associated with your account and protected by the application's authentication and data-access controls.",
  },
  {
    emoji: '🗑️',
    title: "You're in control",
    text: 'You decide what to track and can clear your financial data whenever you choose.',
  },
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

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-glow-center absolute left-1/2 top-0 h-[520px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="hero-glow-side absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-mint/10 blur-3xl" />
      <div className="hero-glow-side-delayed absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-accent/8 blur-3xl" />
    </div>
  )
}

function HeroCtas({
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
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <Button
        type="button"
        className="w-full shadow-[var(--shadow-fab)]"
        size="lg"
        onClick={onTryDemo}
      >
        Try Nirvana
      </Button>
      <form onSubmit={onSignIn} className="w-full">
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          size="lg"
          disabled={signInBusy || !signInReady}
        >
          <GoogleMark />
          {signInBusy ? 'Opening Google…' : 'Sign in'}
        </Button>
      </form>
      {!signInReady ? (
        <p className="text-center text-sm text-warning">
          Add your Firebase environment variables to enable Google sign-in.
        </p>
      ) : null}
    </div>
  )
}
>>>>>>> origin/main

function TrustNote({ className }: { className?: string }) {
  return (
    <div className={cn('max-w-md text-center', className)}>
      <p className="text-sm font-medium text-ink dark:text-white">
        <span aria-hidden>🔒 </span>
        Private by design
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        Your financial data belongs to you. Nirvana doesn&apos;t require your bank password, UPI PIN,
        OTP or banking credentials.
      </p>
    </div>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-ink/5 px-5 py-8 text-center dark:border-white/8">
      <p className="text-xs text-ink-faint">© {new Date().getFullYear()} Nirvana</p>
      <div className="mt-3 flex justify-center">
        <PwaInstallLink />
      </div>
    </footer>
  )
}

export function LoginPage() {
  const { signIn, configured } = useAuth()
  const { enterDemoMode } = useDemo()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const ready = configured && isFirebaseConfigured()

  function onTryDemo() {
    enterDemoMode()
    navigate('/')
  }

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
<<<<<<< HEAD
    <LandingShell>
      <LandingNav onSignIn={onSignIn} signInBusy={busy} signInReady={ready} />
      <main className="relative">
        <LandingHero
          onTryDemo={onTryDemo}
          onSignIn={onSignIn}
          signInBusy={busy}
          signInReady={ready}
        />
        <LandingCapabilities />
        <LandingFeatureShowcase />
        <LandingTrust />
        <LandingFinalCta onTryDemo={onTryDemo} />
      </main>
      <LandingFooter />
    </LandingShell>
=======
    <div className="relative min-h-dvh max-w-[100vw] overflow-x-hidden">
      <HeroBackdrop />

      {/* Hero */}
      <section className="relative flex flex-col items-center px-5 pb-12 pt-safe text-center sm:px-8">
        <NirvanaLoaderLogo className="hero-reveal-scale h-[160px] min-h-[160px] w-auto max-w-[min(100%,360px)] sm:h-[200px] sm:min-h-[200px]" />

        <h1 className="hero-reveal hero-delay-1 mt-8 max-w-3xl font-serif text-[2rem] font-medium leading-[1.12] tracking-tight text-ink sm:text-5xl dark:text-white">
          Your money. One clear picture.
        </h1>

        <p className="hero-reveal hero-delay-2 mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Track your income, expenses, investments, assets, liabilities and net worth — all in one
          simple place.
        </p>

        <div className="hero-reveal hero-delay-3 mt-10">
          <HeroCtas
            onTryDemo={onTryDemo}
            onSignIn={onSignIn}
            signInBusy={busy}
            signInReady={ready}
          />
        </div>

        <TrustNote className="hero-reveal hero-delay-4 mt-8" />
      </section>

      {/* Feature highlights */}
      <section className="relative border-t border-ink/5 bg-surface/50 px-5 py-14 sm:px-8 dark:border-white/8 dark:bg-surface-dark/30">
        <div className="mx-auto max-w-5xl">
          <RevealOnScroll>
            <h2 className="text-center font-serif text-2xl font-medium text-ink sm:text-3xl dark:text-white">
              Everything you need to understand your finances
            </h2>
          </RevealOnScroll>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {features.map((item, index) => (
              <RevealOnScroll key={item.title} delayMs={index * 70}>
                <li className="rounded-[22px] border border-ink/5 bg-surface p-5 text-left shadow-[var(--shadow-soft)] dark:border-white/8 dark:bg-surface-dark">
                  <span className="text-2xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-ink dark:text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.text}</p>
                  {'examples' in item && item.examples ? (
                    <ul className="mt-3 space-y-1.5 border-l-2 border-accent/20 pl-3">
                      {item.examples.map((example) => (
                        <li key={example} className="text-xs italic text-ink-muted">
                          &ldquo;{example}&rdquo;
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              </RevealOnScroll>
            ))}
          </ul>
        </div>
      </section>

      {/* Trust section */}
      <section className="relative px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <RevealOnScroll>
            <h2 className="text-center font-serif text-2xl font-medium text-ink sm:text-3xl dark:text-white">
              Your financial data deserves your trust.
            </h2>
          </RevealOnScroll>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {trustPoints.map((item, index) => (
              <RevealOnScroll key={item.title} delayMs={index * 80}>
                <li className="rounded-[20px] border border-ink/5 bg-canvas/60 p-5 dark:border-white/8 dark:bg-white/5">
                  <p className="text-sm font-semibold text-ink dark:text-white">
                    <span aria-hidden>{item.emoji} </span>
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.text}</p>
                </li>
              </RevealOnScroll>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative border-t border-ink/5 bg-surface/50 px-5 py-14 sm:px-8 dark:border-white/8 dark:bg-surface-dark/30">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <RevealOnScroll>
            <h2 className="font-serif text-2xl font-medium text-ink sm:text-3xl dark:text-white">
              See your financial life in one place.
            </h2>
            <p className="mt-3 text-base text-ink-muted">
              Try Nirvana with sample data — no account required.
            </p>
            <Button type="button" className="mt-6 shadow-[var(--shadow-fab)]" size="lg" onClick={onTryDemo}>
              Try Nirvana
            </Button>
          </RevealOnScroll>
        </div>
      </section>

      <LandingFooter />
    </div>
>>>>>>> origin/main
  )
}
