import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from '@/firebase/config'

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback(null)
    return () => undefined
  }
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth()
  try {
    await signInWithPopup(auth, googleProvider)
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
    if (code.includes('popup') || code.includes('operation-not-supported')) {
      await signInWithRedirect(auth, googleProvider)
      return
    }
    throw error
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth())
}
