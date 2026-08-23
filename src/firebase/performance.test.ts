import { describe, expect, it, vi } from 'vitest'
import {
  resetFirestorePerformanceForTests,
  runFirestoreOperation,
} from '@/firebase/performance'

describe('firestore performance logging', () => {
  it('runs wrapped operations and logs in development mode', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    resetFirestorePerformanceForTests()

    const value = await runFirestoreOperation('Test Operation', async () => 42)

    expect(value).toBe(42)
    if (import.meta.env.DEV) {
      expect(info).toHaveBeenCalled()
      const output = info.mock.calls.map((call) => String(call[0])).join('\n')
      expect(output).toContain('Operation: Test Operation')
      expect(output).toContain('Reads:')
    }

    info.mockRestore()
  })
})
