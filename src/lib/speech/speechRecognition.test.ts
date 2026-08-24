import { describe, expect, it } from 'vitest'
import { speechLocaleForCurrency, isSpeechRecognitionSupported } from '@/lib/speech/speechRecognition'

describe('speechRecognition', () => {
  it('maps INR to en-IN locale', () => {
    expect(speechLocaleForCurrency('INR')).toBe('en-IN')
  })

  it('maps USD to en-US locale', () => {
    expect(speechLocaleForCurrency('USD')).toBe('en-US')
  })

  it('reports unsupported in node test environment', () => {
    expect(isSpeechRecognitionSupported()).toBe(false)
  })
})
