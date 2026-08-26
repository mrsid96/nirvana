import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  computeTooltipPosition,
  findVisibleTourTarget,
  getSpotlightRect,
  waitForLayout,
  type SpotlightRect,
  type TooltipPosition,
} from '@/lib/app-tour'
import { useAppTour } from '@/contexts/AppTourContext'

const TOOLTIP_ESTIMATE_HEIGHT = 220
const TOOLTIP_WIDTH = 320

function SpotlightLayer({
  rect,
  reducedMotion,
}: {
  rect: SpotlightRect | null
  reducedMotion: boolean
}) {
  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[70] bg-ink/50 dark:bg-black/60 motion-reduce:transition-none"
        aria-hidden
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none" aria-hidden>
      <div
        className={cn(
          'absolute rounded-[16px] ring-2 ring-white/80 dark:ring-white/30 motion-reduce:transition-none',
          !reducedMotion && 'transition-all duration-200 ease-out',
        )}
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: '0 0 0 9999px rgba(17, 17, 17, 0.55)',
        }}
      />
    </div>
  )
}

function TourTooltip({
  title,
  description,
  stepIndex,
  totalSteps,
  spotlight,
  onBack,
  onNext,
  onSkip,
  isLast,
  reducedMotion,
}: {
  title: string
  description: string
  stepIndex: number
  totalSteps: number
  spotlight: SpotlightRect | null
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  isLast: boolean
  reducedMotion: boolean
}) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  useEffect(() => {
    const tooltipEl = tooltipRef.current
    const height = tooltipEl?.offsetHeight ?? TOOLTIP_ESTIMATE_HEIGHT
    if (spotlight) {
      setPosition(computeTooltipPosition(spotlight, TOOLTIP_WIDTH, height))
      return
    }
    setPosition({
      top: window.innerHeight / 2 - height / 2,
      left: (window.innerWidth - TOOLTIP_WIDTH) / 2,
      placement: 'bottom',
      maxWidth: TOOLTIP_WIDTH,
    })
  }, [spotlight, title, description, stepIndex])

  useEffect(() => {
    const tooltipEl = tooltipRef.current
    if (!tooltipEl || !spotlight) return

    const update = () => {
      setPosition(computeTooltipPosition(spotlight, TOOLTIP_WIDTH, tooltipEl.offsetHeight))
    }

    const observer = new ResizeObserver(update)
    observer.observe(tooltipEl)
    update()
    return () => observer.disconnect()
  }, [spotlight, stepIndex])

  if (!position) return null

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Tour step ${stepIndex + 1} of ${totalSteps}: ${title}`}
      className={cn(
        'fixed z-[80] pointer-events-auto rounded-[20px] border border-ink/8 bg-surface p-5 shadow-[var(--shadow-soft)] dark:border-white/10 dark:bg-surface-dark motion-reduce:transition-none',
        !reducedMotion && 'transition-all duration-200 ease-out',
      )}
      style={{
        top: position.top,
        left: position.left,
        width: position.maxWidth,
        maxWidth: position.maxWidth,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">
        {stepIndex + 1} of {totalSteps}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-ink dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="min-h-10 px-3"
          onClick={onSkip}
        >
          Skip Tour
        </Button>
        <div className="flex-1" />
        {stepIndex > 0 ? (
          <Button type="button" variant="secondary" className="min-h-10" onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button type="button" className="min-h-10" onClick={onNext}>
          {isLast ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  )
}

export function TourOverlay() {
  const { phase, stepIndex, steps, nextStep, prevStep, requestSkip } = useAppTour()
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const step = steps[stepIndex]

  useEffect(() => {
    if (phase !== 'tour' || !step) {
      setSpotlight(null)
      return
    }

    let cancelled = false

    async function updateSpotlight() {
      await waitForLayout(50)
      if (cancelled || !step) return
      const target = findVisibleTourTarget(step.id)
      if (target) {
        setSpotlight(getSpotlightRect(target))
      } else {
        setSpotlight(null)
      }
    }

    void updateSpotlight()

    const onLayoutChange = () => {
      void updateSpotlight()
    }

    window.addEventListener('resize', onLayoutChange)
    window.addEventListener('scroll', onLayoutChange, true)

    return () => {
      cancelled = true
      window.removeEventListener('resize', onLayoutChange)
      window.removeEventListener('scroll', onLayoutChange, true)
    }
  }, [phase, step, stepIndex])

  useEffect(() => {
    if (phase !== 'tour') return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestSkip()
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault()
        nextStep()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prevStep()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, nextStep, prevStep, requestSkip])

  if (phase !== 'tour' || !step) return null

  return (
    <>
      <SpotlightLayer rect={spotlight} reducedMotion={reducedMotion} />
      <div className="fixed inset-0 z-[75] pointer-events-none" aria-hidden />
      <TourTooltip
        title={step.title}
        description={step.description}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        spotlight={spotlight}
        onBack={prevStep}
        onNext={nextStep}
        onSkip={requestSkip}
        isLast={stepIndex === steps.length - 1}
        reducedMotion={reducedMotion}
      />
    </>
  )
}
