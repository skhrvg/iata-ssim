import { describe, expect, it } from 'vitest'
import { parseIataTime, parseUtcOffsetMinutes } from '../../src/utils/time.ts'

describe('parseIataTime', () => {
  it('parses HHMM', () => {
    expect(parseIataTime('0415')).toEqual({ h: 4, m: 15 })
    expect(parseIataTime('1230')).toEqual({ h: 12, m: 30 })
  })

  it('accepts 2400 as end-of-day', () => {
    expect(parseIataTime('2400')).toEqual({ h: 24, m: 0 })
  })

  it('returns null for blank/invalid', () => {
    expect(parseIataTime('    ')).toBeNull()
    expect(parseIataTime('')).toBeNull()
    expect(parseIataTime('99XX')).toBeNull()
    expect(parseIataTime('2560')).toBeNull()
  })
})

describe('parseUtcOffsetMinutes', () => {
  it('parses positive offsets', () => {
    expect(parseUtcOffsetMinutes('+0300')).toBe(180)
    expect(parseUtcOffsetMinutes('+0000')).toBe(0)
    expect(parseUtcOffsetMinutes('+1400')).toBe(840)
  })

  it('parses negative offsets', () => {
    expect(parseUtcOffsetMinutes('-0500')).toBe(-300)
    expect(parseUtcOffsetMinutes('-0930')).toBe(-570)
  })

  it('returns null for blank/invalid', () => {
    expect(parseUtcOffsetMinutes('     ')).toBeNull()
    expect(parseUtcOffsetMinutes('')).toBeNull()
    expect(parseUtcOffsetMinutes('0300')).toBeNull()
    expect(parseUtcOffsetMinutes('++300')).toBeNull()
  })
})
