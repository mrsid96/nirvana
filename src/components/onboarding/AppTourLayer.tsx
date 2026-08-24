import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { TourCompleteScreen } from '@/components/onboarding/TourCompleteScreen'
import { TourOverlay } from '@/components/onboarding/TourOverlay'
import { SkipTourDialog } from '@/components/onboarding/SkipTourDialog'
import { useAppTour } from '@/contexts/AppTourContext'

export function AppTourLayer() {
  const { phase } = useAppTour()

  if (phase === 'idle') return null

  return (
    <>
      {phase === 'welcome' ? <WelcomeScreen /> : null}
      <TourOverlay />
      {phase === 'complete' ? <TourCompleteScreen /> : null}
      <SkipTourDialog />
    </>
  )
}
