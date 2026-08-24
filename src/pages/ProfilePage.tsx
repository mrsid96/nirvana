import { useState, type FormEvent } from 'react'
import { Compass, Globe, Palette, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { DemoConversionPrompt } from '@/components/DemoConversionPrompt'
import { Button, Card, Field, SectionTitle, Select } from '@/components/ui'
import { useDemo, useEffectiveAuth } from '@/contexts/DemoContext'
import { useOptionalAppTour } from '@/contexts/AppTourContext'
import { useFinance } from '@/contexts/FinanceContext'
import { clearAllFinanceData } from '@/dev/clearFinanceData'
import { seedDemoData } from '@/dev/seedDemoData'
import { migrateFirestoreV1, rebuildDerivedData } from '@/dev/firestoreMigration'
import { COUNTRIES } from '@/lib/money'
import { applyThemeToDocument, persistTheme } from '@/lib/theme'
import type { SupportedCurrency, ThemeMode } from '@/types/user'

const DISCLAIMER =
  'This application is a personal financial tracking and planning tool. Projections are estimates based on user-entered assumptions and are not guaranteed returns or financial advice.'

export function ProfilePage() {
  const { profile, settings, saveSettings, signOutUser, user, isDemoMode, promptSignup, exitDemoMode } =
    useEffectiveAuth()
  const { exitDemoMode: exitDemo } = useDemo()
  const appTour = useOptionalAppTour()
  const finance = useFinance()
  const [country, setCountry] = useState(settings?.country ?? profile?.country ?? 'IN')
  const [currency, setCurrency] = useState<SupportedCurrency>(settings?.currency ?? 'INR')
  const [theme, setTheme] = useState<ThemeMode>(settings?.theme ?? 'light')
  const [busy, setBusy] = useState(false)

  async function onSave(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      if (isDemoMode) {
        persistTheme(theme)
        applyThemeToDocument(theme)
        toast.success('Appearance updated for this demo session')
      } else {
        await saveSettings({ country, currency, theme })
        toast.success('Preferences saved ✨')
      }
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
    link.download = 'nirvana-export.json'
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

  async function onClearAllData() {
    if (!user?.uid) return
    if (
      !window.confirm(
        'Delete ALL financial data (goals, assets, transactions, loans, expenses, income)? This cannot be undone.',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const result = await clearAllFinanceData(user.uid)
      await finance.refresh()
      toast.success(`Cleared ${result.cleared} records`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not clear data')
    } finally {
      setBusy(false)
    }
  }

  async function onRebuildDerived() {
    if (!user?.uid) return
    setBusy(true)
    try {
      const result = await rebuildDerivedData(user.uid, true)
      await finance.refresh()
      toast.success(
        result.discrepancies.length === 0
          ? 'Derived data reconciled — no discrepancies'
          : `Repaired ${result.repairedCounts.assets} assets, ${result.repairedCounts.goals} goals`,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Rebuild failed')
    } finally {
      setBusy(false)
    }
  }

  async function onRunMigration() {
    if (!user?.uid) return
    setBusy(true)
    try {
      const result = await migrateFirestoreV1(user.uid)
      await finance.refresh()
      if (result.success) {
        toast.success(`Migration complete (schema v${result.schemaVersion})`)
      } else {
        toast.error(result.error ?? 'Migration failed')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Migration failed')
    } finally {
      setBusy(false)
    }
  }

  const countryName = COUNTRIES.find((c) => c.countryCode === country)?.name ?? country

  return (
    <div className="space-y-7">
      {isDemoMode ? <DemoConversionPrompt /> : null}

      <header className="flex flex-col items-center pt-2 text-center lg:items-start lg:text-left">
        {profile?.photoURL ? (
          <img
            src={profile.photoURL}
            alt=""
            className="h-20 w-20 rounded-full object-cover ring-4 ring-accent/15"
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-accent to-[#4F46C8] text-2xl font-semibold text-white">
            {(profile?.displayName ?? 'U').slice(0, 1)}
          </div>
        )}
        <h1 className="mt-4 text-xl font-semibold text-ink dark:text-white">{profile?.displayName}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          {isDemoMode ? 'Exploring with sample data' : profile?.email}
        </p>
      </header>

      <section className="space-y-3">
        <SectionTitle title="Preferences" />
        <Card>
          <form className="space-y-4" onSubmit={onSave}>
            {!isDemoMode ? (
              <>
                <Field label="Country">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-ink-muted" />
                    <Select value={country} onChange={(event) => setCountry(event.target.value)} className="flex-1">
                      {COUNTRIES.map((item) => (
                        <option key={item.countryCode} value={item.countryCode}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Field>
                <Field label="Currency">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 shrink-0 text-ink-muted" />
                    <Select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value as SupportedCurrency)}
                      className="flex-1"
                    >
                      {['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Field>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                Country and currency are set to India · INR for this demo experience.
              </p>
            )}
            <Field label="Appearance">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 shrink-0 text-ink-muted" />
                <Select
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as ThemeMode)}
                  className="flex-1"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              </div>
            </Field>
            <p className="text-xs text-ink-faint">
              {isDemoMode ? `INR · ${theme}` : `${countryName} · ${currency} · ${theme}`}
            </p>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Saving…' : isDemoMode ? 'Save appearance' : 'Save preferences'}
            </Button>
          </form>
        </Card>
      </section>

      {!isDemoMode ? (
        <>
          <section className="space-y-3">
            <SectionTitle title="Your data" />
            <Card className="space-y-3">
              <Button variant="secondary" className="w-full" onClick={() => void onExport()}>
                Export my data
              </Button>
              <Button
                variant="ghost"
                className="w-full text-peach"
                disabled={busy}
                onClick={() => void onClearAllData()}
              >
                Clear all financial data
              </Button>
              {import.meta.env.DEV ? (
                <>
                  <Button variant="ghost" className="w-full" disabled={busy} onClick={() => void onSeedDemo()}>
                    Load demo data (dev only)
                  </Button>
                  <Button variant="ghost" className="w-full" disabled={busy} onClick={() => void onRunMigration()}>
                    Run Firestore migration (dev only)
                  </Button>
                  <Button variant="ghost" className="w-full" disabled={busy} onClick={() => void onRebuildDerived()}>
                    Rebuild derived summaries (dev only)
                  </Button>
                </>
              ) : null}
            </Card>
          </section>

          <section className="space-y-3">
            <SectionTitle title="Help & Guidance" />
            <Card className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-start gap-3 px-3"
                onClick={() => appTour?.startTour({ replay: true })}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                  <Compass className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-left">
                  <span className="block font-semibold text-ink dark:text-white">Take App Tour Again</span>
                  <span className="block text-xs font-normal text-ink-muted">
                    Revisit the guided walkthrough of Dashboard, Wealth, Loans, and more
                  </span>
                </span>
              </Button>
            </Card>
          </section>
        </>
      ) : (
        <section className="space-y-3">
          <SectionTitle title="Demo session" />
          <Card className="space-y-3">
            <p className="text-sm text-ink-muted">
              Changes you make here stay on this device for this session only. Refresh the page to
              reset demo data.
            </p>
            <Button className="w-full" onClick={() => void promptSignup?.()}>
              Create your Nirvana account
            </Button>
            <Button variant="secondary" className="w-full" onClick={exitDemoMode ?? exitDemo}>
              Exit demo
            </Button>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle title="About" />
        <Card>
          <p className="text-sm leading-relaxed text-ink-muted">{DISCLAIMER}</p>
        </Card>
      </section>

      <Button
        variant="ghost"
        className="w-full text-ink-muted"
        onClick={() => void (isDemoMode ? (exitDemoMode ?? exitDemo)() : signOutUser())}
      >
        {isDemoMode ? 'Exit demo' : 'Sign out'}
      </Button>
    </div>
  )
}
