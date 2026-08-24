import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
} from '@/lib/speech/speechRecognition'

export interface UseSpeechRecognitionOptions {
  lang: string
  onFinalTranscript?: (text: string) => void
  onError?: (message: string) => void
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions) {
  const { lang, onFinalTranscript, onError } = options
  const [supported] = useState(() => isSpeechRecognitionSupported())
  const [listening, setListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onFinalRef = useRef(onFinalTranscript)
  const onErrorRef = useRef(onError)

  onFinalRef.current = onFinalTranscript
  onErrorRef.current = onError

  const stop = useCallback(() => {
    const rec = recognitionRef.current
    if (rec) {
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
    }
    recognitionRef.current = null
    setListening(false)
    setInterimTranscript('')
  }, [])

  const start = useCallback(() => {
    if (!supported || listening) return false

    const recognition = createSpeechRecognition(lang)
    if (!recognition) {
      onErrorRef.current?.('Voice input is not supported on this device')
      return false
    }

    recognitionRef.current = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result) continue
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) final += transcript
        else interim += transcript
      }
      setInterimTranscript(interim.trim())
      if (final.trim()) {
        onFinalRef.current?.(final.trim())
        setInterimTranscript('')
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error
      if (code !== 'aborted' && code !== 'no-speech') {
        onErrorRef.current?.(
          code === 'not-allowed'
            ? 'Microphone permission is required for voice input'
            : 'Could not capture voice. Try again or type instead.',
        )
      }
      setListening(false)
      setInterimTranscript('')
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setListening(false)
      setInterimTranscript('')
      recognitionRef.current = null
    }

    try {
      recognition.start()
      setListening(true)
      return true
    } catch {
      onErrorRef.current?.('Could not start voice input')
      recognitionRef.current = null
      return false
    }
  }, [supported, listening, lang])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return { supported, listening, interimTranscript, start, stop }
}
