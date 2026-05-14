import { describe, expect, it } from 'vitest'
import { parseDaysOfOperation } from '../../src/utils/days.ts'

describe('parseDaysOfOperation', () => {
  it('parses every-day pattern', () => {
    expect(parseDaysOfOperation('1234567')).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('parses sparse pattern with spaces', () => {
    expect(parseDaysOfOperation(' 234 67')).toEqual([2, 3, 4, 6, 7])
  })

  it('parses single day', () => {
    expect(parseDaysOfOperation('   4   ')).toEqual([4])
  })

  it('parses empty pattern', () => {
    expect(parseDaysOfOperation('       ')).toEqual([])
  })

  it('treats 0 as inactive', () => {
    expect(parseDaysOfOperation('1000000')).toEqual([1])
  })
})
