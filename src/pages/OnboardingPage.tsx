import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Field, Select } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { COUNTRIES } from '@/lib/money'
import type { SupportedCurrency } from '@/types/user'

export function OnboardingPage() {
  const { finishOnboarding, profile } = useAuth()
  const [country, setCountry] = useState(profile?.country ?? 'IN')
  const [currency, setCurrency] = useState<SupportedCurrency>(profile?.currency ?? 'INR')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await finishOnboarding(country, currency)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Let’s set up your dashboard</h1>
      <p className="mt-2 text-stone-500">Choose how money should look. You can change this later.</p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <Field label="Country">
          <Select
            value={country}
            onChange={(event) => {
              const next = COUNTRIES.find((item) => item.countryCode === event.target.value)
              setCountry(event.target.value)
              if (next) setCurrency(next.currency)
            }}
          >
            {COUNTRIES.map((item) => (
              <option key={item.countryCode} value={item.countryCode}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Currency">
          <Select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as SupportedCurrency)}
          >
            {COUNTRIES.filter(
              (item, index, list) =>
                list.findIndex((entry) => entry.currency === item.currency) === index,
            ).map((item) => (
              <option key={item.currency} value={item.currency}>
                {item.currency}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Saving…' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
