import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'nirvana-rules-test'
const rootDir = path.dirname(fileURLToPath(import.meta.url))
const rulesPath = path.resolve(rootDir, '../../firestore.rules')

describe('firestore security rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(rulesPath, 'utf8'),
      },
    })
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup()
  })

  it('denies unauthenticated reads', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(ctx.firestore(), 'users/alice')))
  })

  it('denies cross-user reads', async () => {
    const alice = testEnv.authenticatedContext('alice')
    const bob = testEnv.authenticatedContext('bob')
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'users/alice/goals/g1'), {
        name: 'Retirement',
        targetAmount: 1_000_000,
        startDate: '2026-01-01',
        targetDate: '2045-01-01',
        priority: 'high',
        status: 'active',
        isDeleted: false,
      }),
    )
    await assertFails(getDoc(doc(bob.firestore(), 'users/alice/goals/g1')))
  })

  it('denies cross-user writes', async () => {
    const bob = testEnv.authenticatedContext('bob')
    await assertFails(
      setDoc(doc(bob.firestore(), 'users/alice/goals/g1'), {
        name: 'Hacked',
        targetAmount: 1,
        startDate: '2026-01-01',
        targetDate: '2045-01-01',
        priority: 'low',
        status: 'active',
        isDeleted: false,
      }),
    )
  })

  it('allows owner-scoped goal create with valid money', async () => {
    const alice = testEnv.authenticatedContext('alice')
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'users/alice/goals/g1'), {
        name: 'Retirement',
        targetAmount: 5_000_000,
        startDate: '2026-01-01',
        targetDate: '2045-01-01',
        priority: 'high',
        status: 'active',
        isDeleted: false,
      }),
    )
  })

  it('allows owner flat asset writes', async () => {
    const alice = testEnv.authenticatedContext('alice')
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'users/alice/assets/a1'), {
        name: 'SIP Fund',
        goalId: 'g1',
        currentValue: 500_000,
        investedAmount: 450_000,
        isDeleted: false,
      }),
    )
  })

  it('allows owner recurring rule writes', async () => {
    const alice = testEnv.authenticatedContext('alice')
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'users/alice/recurringRules/r1'), {
        type: 'INCOME',
        name: 'Salary',
        amount: 350_000,
        frequency: 'MONTHLY',
        scheduledDay: 30,
        startDate: '2026-01-01',
        status: 'ACTIVE',
        isDeleted: false,
      }),
    )
  })
})
