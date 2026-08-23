import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { getDb } from '@/firebase/config'

export function nowIso(): string {
  return new Date().toISOString()
}

export function stamp(): {
  createdAt: ReturnType<typeof serverTimestamp>
  updatedAt: ReturnType<typeof serverTimestamp>
} {
  return { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
}

export function touch(): { updatedAt: ReturnType<typeof serverTimestamp> } {
  return { updatedAt: serverTimestamp() }
}

export function toIso(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as Timestamp).toDate().toISOString()
  }
  return nowIso()
}

export async function getDocument<T>(path: string): Promise<T | null> {
  const snap = await getDoc(doc(getDb(), path))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as T
}

export async function listDocuments<T>(path: string): Promise<T[]> {
  const snap = await getDocs(collection(getDb(), path))
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
}

export async function upsert(path: string, data: DocumentData): Promise<void> {
  await setDoc(doc(getDb(), path), clean(data), { merge: true })
}

export async function patch(path: string, data: DocumentData): Promise<void> {
  await updateDoc(doc(getDb(), path), clean(data))
}

export function newId(path: string): string {
  return doc(collection(getDb(), path)).id
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    )
  }
  return value
}

export function clean<T extends DocumentData>(data: T): T {
  return stripUndefined(data) as T
}
