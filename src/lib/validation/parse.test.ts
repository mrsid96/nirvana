import { describe, expect, it } from 'vitest'
import { parseAmountInput, parseDayOfMonth, parsePositiveInteger, parseRatePercent } from '@/lib/validation/parse'

describe('form amount parsing', () => {
  it('rejects empty amounts', () => {
    expect(parseAmountInput('', 'INR').ok).toBe(false)
  })

  it('rejects negative amounts', () => {
    expect(parseAmountInput('-5', 'INR').ok).toBe(false)
  })

  it('parses INR minor units', () => {
    const result = parseAmountInput('50', 'INR')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.minor).toBe(5000)
  })

  it('parses USD cents', () => {
    const result = parseAmountInput('10.5', 'USD')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.minor).toBe(1050)
  })

  it('parses zero when allowed', () => {
    const result = parseAmountInput('0', 'INR', { allowZero: true })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.minor).toBe(0)
  })
})

describe('positive integer parsing', () => {
  it('accepts valid tenure', () => {
    expect(parsePositiveInteger('24', 'Tenure (months)').ok).toBe(true)
  })

  it('rejects zero tenure', () => {
    expect(parsePositiveInteger('0', 'Tenure (months)').ok).toBe(false)
  })
})

describe('day of month parsing', () => {
  it('accepts 31', () => {
    expect(parseDayOfMonth('31').ok).toBe(true)
  })

  it('rejects 32', () => {
    expect(parseDayOfMonth('32').ok).toBe(false)
  })
})

describe('rate parsing', () => {
  it('accepts valid rates', () => {
    expect(parseRatePercent('8.5').ok).toBe(true)
  })

  it('rejects rates above 100', () => {
    expect(parseRatePercent('101').ok).toBe(false)
  })
})
