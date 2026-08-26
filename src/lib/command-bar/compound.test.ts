import { describe, expect, it } from 'vitest'
import { splitCompoundInput } from '@/lib/command-bar/compound'

describe('splitCompoundInput', () => {
  it('returns single clause when no conjunction', () => {
    expect(splitCompoundInput('Spent 500 on groceries')).toEqual(['Spent 500 on groceries'])
  })

  it('splits salary and investment compound', () => {
    expect(splitCompoundInput('Got salary 2L and invested 50k in retirement')).toEqual([
      'Got salary 2L',
      'invested 50k in retirement',
    ])
  })

  it('splits expense and income', () => {
    expect(splitCompoundInput('Received 50000 salary and spent 1500 on food')).toEqual([
      'Received 50000 salary',
      'spent 1500 on food',
    ])
  })

  it('does not split non-actionable and phrases', () => {
    expect(splitCompoundInput('Retirement and emergency fund')).toEqual(['Retirement and emergency fund'])
  })
})
