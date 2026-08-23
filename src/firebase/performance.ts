type OperationKind = 'read' | 'write'

export interface FirestoreOperationStats {
  reads: number
  writes: number
  parallelBatches: number
  durationMs: number
  duplicateReads: number
  slowQueries: number
  collectionScans: number
}

interface ActiveOperation {
  name: string
  reads: number
  writes: number
  parallelBatches: number
  startedAt: number
  readPaths: Map<string, number>
  slowQueries: number
  collectionScans: number
}

const SLOW_QUERY_MS = 800
const COLLECTION_SCAN_THRESHOLD = 100

let active: ActiveOperation | null = null
const stack: ActiveOperation[] = []

function isDevLoggingEnabled(): boolean {
  return import.meta.env.DEV
}

function logLine(message: string): void {
  if (!isDevLoggingEnabled()) return
  console.info(message)
}

function beginOperation(name: string): void {
  if (!isDevLoggingEnabled()) return
  const op: ActiveOperation = {
    name,
    reads: 0,
    writes: 0,
    parallelBatches: 0,
    startedAt: performance.now(),
    readPaths: new Map(),
    slowQueries: 0,
    collectionScans: 0,
  }
  if (active) stack.push(active)
  active = op
}

function endOperation(): FirestoreOperationStats | null {
  if (!active) return null
  const finished = active
  active = stack.pop() ?? null
  const durationMs = Math.round(performance.now() - finished.startedAt)
  let duplicateReads = 0
  for (const count of finished.readPaths.values()) {
    if (count > 1) duplicateReads += count - 1
  }
  const stats: FirestoreOperationStats = {
    reads: finished.reads,
    writes: finished.writes,
    parallelBatches: finished.parallelBatches,
    durationMs,
    duplicateReads,
    slowQueries: finished.slowQueries,
    collectionScans: finished.collectionScans,
  }
  logLine(
    `[Firestore]\nOperation: ${finished.name}\nReads: ${stats.reads}\nWrites: ${stats.writes}\nParallel batches: ${stats.parallelBatches}\nDuration: ${stats.durationMs}ms`,
  )
  if (duplicateReads > 0) {
    logLine(`[Firestore] Warning: ${duplicateReads} duplicate read(s) in ${finished.name}`)
  }
  if (finished.collectionScans > 0) {
    logLine(`[Firestore] Warning: ${finished.collectionScans} large collection scan(s) in ${finished.name}`)
  }
  if (finished.slowQueries > 0) {
    logLine(`[Firestore] Warning: ${finished.slowQueries} slow quer${finished.slowQueries === 1 ? 'y' : 'ies'} in ${finished.name}`)
  }
  return stats
}

export async function runFirestoreOperation<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isDevLoggingEnabled()) return fn()
  beginOperation(name)
  try {
    return await fn()
  } finally {
    endOperation()
  }
}

export function markParallelBatch(): void {
  if (!active) return
  active.parallelBatches += 1
}

export function trackFirestoreOperation(
  kind: OperationKind,
  path: string,
  meta?: { docCount?: number; durationMs?: number; unfiltered?: boolean },
): void {
  if (!active) return
  if (kind === 'read') {
    active.reads += 1
    active.readPaths.set(path, (active.readPaths.get(path) ?? 0) + 1)
    if (meta?.unfiltered && (meta.docCount ?? 0) >= COLLECTION_SCAN_THRESHOLD) {
      active.collectionScans += 1
      logLine(`[Firestore] Collection scan: ${path} (${meta.docCount} docs)`)
    }
    if ((meta?.durationMs ?? 0) >= SLOW_QUERY_MS) {
      active.slowQueries += 1
      logLine(`[Firestore] Slow query: ${path} (${Math.round(meta!.durationMs!)}ms)`)
    }
  } else {
    active.writes += 1
  }
}

/** @internal test helper */
export function resetFirestorePerformanceForTests(): void {
  active = null
  stack.length = 0
}
