import { describe, expect, it } from 'vitest'
import { toMinorUnits, toMajorUnits, addMoney } from '@/lib/money'

describe('money minor units', () => {
  it('converts INR rupees to paise', () => {
    expect(toMinorUnits(1, 'INR')).toBe(100)
    expect(toMinorUnits(50_000, 'INR')).toBe(5_000_000)
  })

  it('converts USD dollars to cents', () => {
    expect(toMinorUnits(1, 'USD')).toBe(100)
    expect(toMinorUnits(10.5, 'USD')).toBe(1050)
  })

  it('rounds decimal minor units', () => {
    expect(toMinorUnits(1.235, 'INR')).toBe(124)
  })

  it('converts back to major units', () => {
    expect(toMajorUnits(5_000_000, 'INR')).toBe(50_000)
    expect(toMajorUnits(1050, 'USD')).toBe(10.5)
  })

  it('adds money in minor units', () => {
    expect(addMoney(100, 200, 300)).toBe(600)
  })

  it('handles zero', () => {
    expect(toMinorUnits(0, 'INR')).toBe(0)
    expect(addMoney(0, 0)).toBe(0)
  })

  it('handles large values', () => {
    const large = 90_000_000_000
    expect(toMajorUnits(large, 'INR')).toBe(900_000_000)
  })
})
