import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { logDevError } from '@/lib/errors'
import {
  findVisibleTourTarget,
  scrollTourTargetIntoView,
  shouldAutoStartAppTour,
  TOUR_STEPS,
  waitForLayout,
  type TourStep,
} from '@/lib/app-tour'

export type AppTourPhase = 'idle' | 'welcome' | 'tour' | 'complete'

type DashboardTab = 'month' | 'notifications'

interface AppTourContextValue {
  phase: AppTourPhase
  stepIndex: number
  steps: TourStep[]
  isActive: boolean
  skipConfirmOpen: boolean
  requestedDashboardTab: DashboardTab | null
  startTour: (options?: { replay?: boolean }) => void
  beginTourFromWelcome: () => void
  skipFromWelcome: () => void
  nextStep: () => void
  prevStep: () => void
  requestSkip: () => void
  confirmSkip: () => void
  cancelSkip: () => void
  finishTour: () => void
  clearDashboardTabRequest: () => void
}

const AppTourContext = createContext<AppTourContextValue | null>(null)

export function AppTourProvider({ children }: { children: ReactNode }) {
  const { profile, markAppTourComplete } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [phase, setPhase] = useState<AppTourPhase>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false)
  const [requestedDashboardTab, setRequestedDashboardTab] = useState<DashboardTab | null>(null)
  const autoStartedRef = useRef(false)
  const completingRef = useRef(false)

  const completeTour = useCallback(async () => {
    if (completingRef.current) return
    completingRef.current = true
    try {
      await markAppTourComplete()
    } catch (error) {
      logDevError(error)
    } finally {
      setPhase('idle')
      setStepIndex(0)
      setSkipConfirmOpen(false)
      setRequestedDashboardTab(null)
      completingRef.current = false
    }
  }, [markAppTourComplete])

  const prepareStep = useCallback(
    async (index: number) => {
      const step = TOUR_STEPS[index]
      if (!step) return false

      if (step.route && location.pathname !== step.route) {
        navigate(step.route)
        await waitForLayout(200)
      }

      if (step.dashboardTab) {
        setRequestedDashboardTab(step.dashboardTab)
        await waitForLayout(250)
      } else {
        setRequestedDashboardTab(null)
      }

      let target = findVisibleTourTarget(step.id)
      if (!target) {
        await waitForLayout(300)
        target = findVisibleTourTarget(step.id)
      }

      if (target) {
        await scrollTourTargetIntoView(target)
        return true
      }

      console.warn(`[app-tour] Target not found for step "${step.id}" — skipping`)
      return false
    },
    [location.pathname, navigate],
  )

  const prepareStepWithFallback = useCallback(
    async (index: number) => {
      let current = index
      while (current < TOUR_STEPS.length) {
        const found = await prepareStep(current)
        if (found) {
          setStepIndex(current)
          return
        }
        current += 1
      }
      setPhase('complete')
      setRequestedDashboardTab(null)
    },
    [prepareStep],
  )

  const startTour = useCallback(
    (options?: { replay?: boolean }) => {
      autoStartedRef.current = true
      setStepIndex(0)
      setSkipConfirmOpen(false)
      if (options?.replay) {
        setPhase('tour')
        void prepareStepWithFallback(0)
        return
      }
      setPhase('welcome')
    },
    [prepareStepWithFallback],
  )

  const beginTourFromWelcome = useCallback(() => {
    setPhase('tour')
    void prepareStepWithFallback(0)
  }, [prepareStepWithFallback])

  const skipFromWelcome = useCallback(() => {
    void completeTour()
  }, [completeTour])

  const finishTour = useCallback(() => {
    void completeTour()
  }, [completeTour])

  const nextStep = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) {
      setPhase('complete')
      setRequestedDashboardTab(null)
      return
    }
    const next = stepIndex + 1
    void prepareStepWithFallback(next)
  }, [stepIndex, prepareStepWithFallback])

  const prevStep = useCallback(() => {
    if (stepIndex <= 0) return
    const prev = stepIndex - 1
    void prepareStepWithFallback(prev)
  }, [stepIndex, prepareStepWithFallback])

  const requestSkip = useCallback(() => {
    setSkipConfirmOpen(true)
  }, [])

  const confirmSkip = useCallback(() => {
    void completeTour()
  }, [completeTour])

  const cancelSkip = useCallback(() => {
    setSkipConfirmOpen(false)
  }, [])

  const clearDashboardTabRequest = useCallback(() => {
    setRequestedDashboardTab(null)
  }, [])

  useEffect(() => {
    if (!profile?.onboardingComplete || autoStartedRef.current) return
    if (!shouldAutoStartAppTour(profile.hasCompletedOnboarding, profile.onboardingVersion)) return
    autoStartedRef.current = true
    setPhase('welcome')
  }, [profile])

  const value = useMemo<AppTourContextValue>(
    () => ({
      phase,
      stepIndex,
      steps: TOUR_STEPS,
      isActive: phase !== 'idle',
      skipConfirmOpen,
      requestedDashboardTab,
      startTour,
      beginTourFromWelcome,
      skipFromWelcome,
      nextStep,
      prevStep,
      requestSkip,
      confirmSkip,
      cancelSkip,
      finishTour,
      clearDashboardTabRequest,
    }),
    [
      phase,
      stepIndex,
      skipConfirmOpen,
      requestedDashboardTab,
      startTour,
      beginTourFromWelcome,
      skipFromWelcome,
      nextStep,
      prevStep,
      requestSkip,
      confirmSkip,
      cancelSkip,
      finishTour,
      clearDashboardTabRequest,
    ],
  )

  return <AppTourContext.Provider value={value}>{children}</AppTourContext.Provider>
}

export function useAppTour(): AppTourContextValue {
  const value = useContext(AppTourContext)
  if (!value) throw new Error('useAppTour must be used within AppTourProvider')
  return value
}

export function useOptionalAppTour(): AppTourContextValue | null {
  return useContext(AppTourContext)
}
