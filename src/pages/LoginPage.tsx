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
  )
}
