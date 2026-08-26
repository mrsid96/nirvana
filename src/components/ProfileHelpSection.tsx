import { Compass } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { ProfileWikiSection } from '@/components/ProfileWikiSection'

export function ProfileHelpSection({
  onStartTour,
  showTour = true,
}: {
  onStartTour: () => void
  showTour?: boolean
}) {
  return (
    <section className="space-y-3">
      <SectionTitle title="Help & guidance" />
      <div className="space-y-3">
        {showTour ? (
          <Card>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[14px] px-1 py-1 text-left transition hover:bg-ink/5 dark:hover:bg-white/5"
              onClick={onStartTour}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <Compass className="h-4 w-4" strokeWidth={2} />
              </span>
              <span>
                <span className="block font-semibold text-ink dark:text-white">Take app tour again</span>
                <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                  Revisit the guided walkthrough of Dashboard, Wealth, Loans, and more
                </span>
              </span>
            </button>
          </Card>
        ) : null}
        <ProfileWikiSection />
      </div>
    </section>
  )
}
