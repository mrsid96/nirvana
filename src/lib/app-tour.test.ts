import { describe, expect, it } from 'vitest'
import {
  CURRENT_ONBOARDING_VERSION,
  shouldAutoStartAppTour,
} from '@/lib/app-tour'

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
