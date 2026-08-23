import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Card, Field, Select } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import { seedDemoData } from '@/dev/seedDemoData'
import { COUNTRIES } from '@/lib/money'
import type { SupportedCurrency, ThemeMode } from '@/types/user'

const DISCLAIMER =
  'This application is a personal financial tracking and planning tool. Projections are estimates based on user-entered assumptions and are not guaranteed returns or financial advice.'

export function ProfilePage() {
  const { profile, settings, saveSettings, signOutUser, user } = useAuth()
  const finance = useFinance()
  const [country, setCountry] = useState(settings?.country ?? profile?.country ?? 'IN')
  const [currency, setCurrency] = useState<SupportedCurrency>(settings?.currency ?? 'INR')
  const [theme, setTheme] = useState<ThemeMode>(settings?.theme ?? 'system')
  const [busy, setBusy] = useState(false)

  async function onSave(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await saveSettings({ country, currency, theme })
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function onExport() {
    const data = await finance.exportJson()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'codex-wealth-export.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  }

  async function onSeedDemo() {
    if (!user?.uid) return
    if (
      !window.confirm(
        'Load sample goals, assets, loans, and transactions? This adds data to your account.',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await seedDemoData(user.uid)
      await finance.refresh()
      toast.success('Demo data loaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load demo data')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-4">
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-teal-700 text-xl font-semibold text-white">
            {(profile?.displayName ?? 'U').slice(0, 1)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{profile?.displayName}</h1>
          <p className="text-sm text-stone-500">{profile?.email}</p>
        </div>
      </header>

      <Card>
        <form className="space-y-4" onSubmit={onSave}>
          <Field label="Country">
            <Select value={country} onChange={(event) => setCountry(event.target.value)}>
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
              {['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Theme">
            <Select value={theme} onChange={(event) => setTheme(event.target.value as ThemeMode)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Data</h2>
        <Button variant="secondary" onClick={() => void onExport()}>
          Export my data
        </Button>
        {import.meta.env.DEV ? (
          <Button variant="ghost" disabled={busy} onClick={() => void onSeedDemo()}>
            Load demo data (dev only)
          </Button>
        ) : null}
      </Card>

      <Card>
        <h2 className="font-semibold">About</h2>
        <p className="mt-2 text-sm text-stone-500">{DISCLAIMER}</p>
      </Card>

      <Button variant="ghost" onClick={() => void signOutUser()}>
        Sign out
      </Button>
    </div>
  )
}
