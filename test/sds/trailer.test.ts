import { describe, expect, it } from 'vitest'
import { parseTrailerRecord } from '../../src/sds/records/trailer.ts'
import { RecordType } from '../../src/sds/types.ts'

describe('parseTrailerRecord', () => {
  it('parses all spec fields per IATA SSIM § 7.5.5', () => {
    const line
      = '5' // 1: record type
      + ' ' // 2: spare
      + 'XX ' // 3-5: airline
      + '15MAR26' // 6-12: release date
      + ' '.repeat(175) // 13-187: spare
      + '003372' // 188-193: serial number check reference
      + 'E' // 194: continuation/end code
      + '003373' // 195-200: record serial
    expect(line.length).toBe(200)

    const result = parseTrailerRecord(line, 3381)
    expect(result.type).toBe(RecordType.Trailer)
    expect(result.airlineDesignator).toBe('XX')
    expect(result.releaseDate).toEqual(new Date(Date.UTC(2026, 2, 15)))
    expect(result.serialNumberCheckReference).toBe(3372)
    expect(result.continuationEndCode).toBe('E')
    expect(result.recordSerialNumber).toBe(3373)
  })

  it('parses a trailer with no release date (blank-filled)', () => {
    const line
      = '5' // 1
      + ' ' // 2
      + 'AB ' // 3-5
      + ' '.repeat(7) // 6-12: blank-filled release date
      + ' '.repeat(175) // 13-187
      + '000099' // 188-193: check ref
      + 'C' // 194: continuation
      + '000100' // 195-200
    expect(line.length).toBe(200)

    const result = parseTrailerRecord(line, 100)
    expect(result.releaseDate).toBeNull()
    expect(result.continuationEndCode).toBe('C')
    expect(result.serialNumberCheckReference).toBe(99)
    expect(result.recordSerialNumber).toBe(100)
  })
})
