import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  waitForPendingWrites,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Transaction,
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

export type ListedPage<T> = {
  items: T[]
  cursor: QueryDocumentSnapshot | null
  hasMore: boolean
}

export async function queryDocuments<T>(
  path: string,
  constraints: QueryConstraint[],
): Promise<T[]> {
  const snap = await getDocs(query(collection(getDb(), path), ...constraints))
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
}

export async function queryDocumentsPage<T>(
  path: string,
  constraints: QueryConstraint[],
  pageSize: number,
  cursor?: QueryDocumentSnapshot | null,
): Promise<ListedPage<T>> {
  const parts: QueryConstraint[] = [...constraints, limit(pageSize)]
  if (cursor) parts.push(startAfter(cursor))
  const snap = await getDocs(query(collection(getDb(), path), ...parts))
  const items = snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
  const last = snap.docs.at(-1) ?? null
  return {
    items,
    cursor: last,
    hasMore: snap.docs.length === pageSize,
  }
}

export function notDeleted(): QueryConstraint {
  return where('isDeleted', '==', false)
}

export function byField(field: string, value: unknown): QueryConstraint {
  return where(field, '==', value)
}

export function newestFirst(field = 'date'): QueryConstraint {
  return orderBy(field, 'desc')
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

export function dbDoc(path: string) {
  return doc(getDb(), path)
}

export function createWriteBatch() {
  return writeBatch(getDb())
}

export async function runDbTransaction<T>(fn: (transaction: Transaction) => Promise<T>): Promise<T> {
  return runTransaction(getDb(), fn)
}

export async function flushPendingWrites(db?: Firestore): Promise<void> {
  await waitForPendingWrites(db ?? getDb())
}

export function snapshotData<T>(snap: DocumentSnapshot): T | null {
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as T
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

export { where, orderBy, limit, startAfter }
