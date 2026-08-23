import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { PwaInstallLink } from '@/components/PwaInstallLink'
import { NirvanaLoaderLogo } from '@/components/NirvanaLogo'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { isFirebaseConfigured } from '@/firebase/config'

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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#6657E8] via-[#5B4DD8] to-canvas px-6 py-12 pt-safe dark:to-canvas-dark lg:bg-none">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <NirvanaLoaderLogo size="hero" className="mb-5" />
        <p className="text-3xl font-semibold tracking-tight text-white lg:text-ink dark:lg:text-white">
          Nirvana
        </p>
        <h1 className="mt-4 font-serif text-3xl font-medium leading-tight text-white lg:text-4xl lg:text-ink dark:lg:text-white">
          Your money is <span className="italic">growing</span>.
        </h1>
        <p className="mt-3 max-w-sm text-white/80 lg:text-ink-muted">
          A friendly companion for goals, investments, loans and monthly progress.
        </p>
        <div className="mt-10 w-full rounded-[24px] bg-surface p-6 shadow-[var(--shadow-soft)] dark:bg-surface-dark lg:mt-8 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          <form onSubmit={onSignIn}>
            <Button type="submit" className="w-full" size="lg" disabled={busy || !ready}>
              {busy ? 'Opening Google…' : 'Continue with Google'}
            </Button>
          </form>
          {!ready ? (
            <p className="mt-4 text-sm text-warning">
              Add your Firebase environment variables to enable Google sign-in.
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex justify-center">
          <PwaInstallLink />
        </div>
      </div>
    </div>
  )
}
