import type { SupportedCurrency } from '@/types/user'

/** BCP-47 locales tuned for money commands per currency region */
export const SPEECH_LOCALES: Record<SupportedCurrency, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  SGD: 'en-SG',
  AED: 'en-AE',
}

export function speechLocaleForCurrency(currency: SupportedCurrency): string {
  return SPEECH_LOCALES[currency] ?? 'en-US'
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(getSpeechRecognitionConstructor())
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function createSpeechRecognition(lang: string): SpeechRecognition | null {
  const Ctor = getSpeechRecognitionConstructor()
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  recognition.lang = lang
  return recognition
}
