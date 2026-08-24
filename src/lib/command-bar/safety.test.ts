import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const parserFiles = [
  'command-bar/parser.ts',
  'command-bar/amount.ts',
  'command-bar/date.ts',
  'command-bar/entities.ts',
  'command-bar/intents.ts',
  'command-bar/matcher.ts',
  'command-bar/queries.ts',
  'command-bar/labels.ts',
  'command-bar/types.ts',
]

const forbiddenImports = [
  '@/firebase/firestore',
  '@/services/financeService',
  'firebase/firestore',
  'firebase/app',
]

describe('command-bar financial safety', () => {
  for (const file of parserFiles) {
    it(`${file} does not import Firestore or financeService`, () => {
      const content = readFileSync(join(root, file), 'utf8')
      for (const imp of forbiddenImports) {
        expect(content).not.toContain(imp)
      }
    })
  }

  it('executor only imports finance through function parameter, not firestore', () => {
    const content = readFileSync(join(root, 'command-bar/executor.ts'), 'utf8')
    expect(content).not.toContain('firebase')
    expect(content).not.toContain('financeService')
    expect(content).not.toContain('firestore')
  })

  it('parseCommand never triggers writes — parser has no execute function', () => {
    const content = readFileSync(join(root, 'command-bar/parser.ts'), 'utf8')
    expect(content).not.toContain('addExpense')
    expect(content).not.toContain('addTransaction')
    expect(content).not.toContain('createTransaction')
  })
})
