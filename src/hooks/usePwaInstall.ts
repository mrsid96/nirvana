import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    setIsIos(isIosDevice())

    const onInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canInstall = !isInstalled && (deferredPrompt !== null || isIos)

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setIsInstalled(true)
      setDeferredPrompt(null)
      return { kind: 'native' as const }
    }

    if (isIos) return { kind: 'ios' as const }
    return { kind: 'unavailable' as const }
  }, [deferredPrompt, isIos])

  return { canInstall, install, isIos, isInstalled }
}
