export function toUserMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code)
    if (code.includes('permission-denied')) {
      return "We couldn't save this. Please try again."
    }
    if (code.includes('unavailable') || code.includes('network')) {
      return "You're offline. Changes will sync when you're back online."
    }
    if (code.includes('popup-closed')) {
      return 'Sign-in was cancelled.'
    }
  }
  if (error instanceof Error && error.message === 'FIREBASE_NOT_CONFIGURED') {
    return 'Firebase is not configured yet. Add your environment variables to continue.'
  }
  return 'Something went wrong. Please try again.'
}

export function logDevError(error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(error)
  }
}
