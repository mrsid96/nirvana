import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="text-sm font-medium text-teal-700">Codex Wealth</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">See where your money stands.</h1>
      <p className="mt-3 text-stone-500">
        Track goals, investments, loans and monthly cash flow in one calm place.
      </p>
      <form className="mt-8" onSubmit={onSignIn}>
        <Button type="submit" className="w-full" disabled={busy || !ready}>
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </Button>
      </form>
      {!ready ? (
        <p className="mt-4 text-sm text-amber-700">
          Add your Firebase environment variables to enable Google sign-in.
        </p>
      ) : null}
    </div>
  )
}
