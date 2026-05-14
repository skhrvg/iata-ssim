import { describe, expect, it } from 'vitest'
import { parseSegmentDataRecord } from '../../src/sds/records/segmentData.ts'
import { RecordType } from '../../src/sds/types.ts'

describe('parseSegmentDataRecord', () => {
  it('parses a synthetic DEI 050 record per IATA SSIM § 7.5.4', () => {
    const line
      = '4' // 1
      + ' ' // 2
      + 'XX ' // 3-5
      + '0006' // 6-9
      + '01' // 10-11
      + '01' // 12-13
      + 'J' // 14
      + ' '.repeat(13) // 15-27
      + 'A' // 28: IVI overflow
      + 'B' // 29: board ind
      + 'O' // 30: off ind
      + '050' // 31-33: DEI
      + 'AAA' // 34-36: board point
      + 'BBB' // 37-39: off point
      + 'MEAL SERVICE INFORMATION'.padEnd(155, ' ') // 40-194
      + '000123' // 195-200
    expect(line.length).toBe(200)

    const result = parseSegmentDataRecord(line, 100)
    expect(result.type).toBe(RecordType.SegmentData)
    expect(result.airlineDesignator).toBe('XX')
    expect(result.flightNumber).toBe('0006')
    expect(result.dataElementIdentifier).toBe('050')
    expect(result.boardPoint).toBe('AAA')
    expect(result.offPoint).toBe('BBB')
    expect(result.data).toBe('MEAL SERVICE INFORMATION')
    expect(result.serialNumber).toBe(123)
  })
})
