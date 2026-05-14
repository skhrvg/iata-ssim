import { describe, expect, it } from 'vitest'
import { parseHeaderRecord } from '../../src/sds/records/header.ts'
import { RecordType } from '../../src/sds/types.ts'

describe('parseHeaderRecord', () => {
  it('parses all spec fields per IATA SSIM § 7.5.1', () => {
    const line
      = '1' // 1: record type
      + 'AIRLINE STANDARD SCHEDULE DATA SET' // 2-35: title
      + ' '.repeat(5) // 36-40: spare
      + '2' // 41: number of seasons
      + ' '.repeat(150) // 42-191: spare
      + '001' // 192-194: data set serial number
      + '000001' // 195-200: record serial number
    expect(line.length).toBe(200)

    const result = parseHeaderRecord(line, 1)
    expect(result.type).toBe(RecordType.Header)
    expect(result.title).toBe('AIRLINE STANDARD SCHEDULE DATA SET')
    expect(result.numberOfSeasons).toBe('2')
    expect(result.dataSetSerialNumber).toBe('001')
    expect(result.recordSerialNumber).toBe(1)
  })
})
