import { describe, expect, it } from 'vitest'
import { parseIataDate } from '../../src/utils/date.ts'

describe('parseIataDate', () => {
  it('parses common date', () => {
    expect(parseIataDate('31MAR26')).toEqual(new Date(Date.UTC(2026, 2, 31)))
  })

  it('parses every month', () => {
    expect(parseIataDate('01JAN24')).toEqual(new Date(Date.UTC(2024, 0, 1)))
    expect(parseIataDate('15DEC24')).toEqual(new Date(Date.UTC(2024, 11, 15)))
  })

  it('handles year window: 00-69 → 20xx', () => {
    expect(parseIataDate('01JAN00')).toEqual(new Date(Date.UTC(2000, 0, 1)))
    expect(parseIataDate('01JAN69')).toEqual(new Date(Date.UTC(2069, 0, 1)))
  })

  it('handles year window: 70-99 → 19xx', () => {
    expect(parseIataDate('01JAN70')).toEqual(new Date(Date.UTC(1970, 0, 1)))
    expect(parseIataDate('01JAN99')).toEqual(new Date(Date.UTC(1999, 0, 1)))
  })

  it('returns null for blank/invalid', () => {
    expect(parseIataDate('       ')).toBeNull()
    expect(parseIataDate('')).toBeNull()
    expect(parseIataDate('XXJANXX')).toBeNull()
    expect(parseIataDate('01ZZZ26')).toBeNull()
    expect(parseIataDate('31MAR2')).toBeNull()
  })

  it('lowercase month also accepted', () => {
    expect(parseIataDate('31mar26')).toEqual(new Date(Date.UTC(2026, 2, 31)))
  })
})
