/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  computeTooltipPosition,
  CURRENT_ONBOARDING_VERSION,
  getSpotlightRect,
  shouldAutoStartAppTour,
} from '@/lib/app-tour'

describe('computeTooltipPosition', () => {
  const originalInnerHeight = window.innerHeight
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true })
  })

  it('keeps tooltip within viewport when spotlight is near bottom edge', () => {
    const spotlight = getSpotlightRect({
      getBoundingClientRect: () => ({
        top: 720,
        left: 16,
        width: 368,
        height: 44,
        right: 384,
        bottom: 764,
        x: 16,
        y: 720,
        toJSON: () => ({}),
      }),
    } as Element)

    const position = computeTooltipPosition(spotlight, 320, 200)
    expect(position.top + 200).toBeLessThanOrEqual(800 - 16)
    expect(position.top).toBeGreaterThanOrEqual(16)
  })
})

describe('shouldAutoStartAppTour', () => {
  it('starts for new users explicitly marked incomplete', () => {
    expect(shouldAutoStartAppTour(false, 0)).toBe(true)
  })

  it('does not start for legacy users without the field', () => {
    expect(shouldAutoStartAppTour(undefined, undefined)).toBe(false)
  })

  it('does not start when onboarding is complete at current version', () => {
    expect(shouldAutoStartAppTour(true, CURRENT_ONBOARDING_VERSION)).toBe(false)
  })

  it('starts when onboarding version is behind current', () => {
    expect(shouldAutoStartAppTour(true, CURRENT_ONBOARDING_VERSION - 1)).toBe(true)
  })
})
