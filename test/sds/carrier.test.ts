import { describe, expect, it } from 'vitest'
import { parseCarrierRecord } from '../../src/sds/records/carrier.ts'
import { RecordType } from '../../src/sds/types.ts'

describe('parseCarrierRecord', () => {
  it('parses all spec fields per IATA SSIM § 7.5.2', () => {
    const line
      = '2' // 1
      + 'U' // 2: time mode
      + 'XX ' // 3-5: airline
      + ' '.repeat(5) // 6-10: spare
      + 'S26' // 11-13: season
      + ' ' // 14: spare
      + '29MAR26' // 15-21: valid from
      + '25OCT26' // 22-28: valid to
      + '13MAR26' // 29-35: creation
      + 'EXAMPLE TITLE OF DATA        ' // 36-64: title (29 chars)
      + '15MAR26' // 65-71: release
      + 'C' // 72: schedule status
      + 'REF/DEMO/2026                      ' // 73-107: creator reference (35 chars)
      + 'D' // 108: duplicate airline designator marker
      + ' '.repeat(60) // 109-168: general info
      + 'S' // 169: secure flight indicator (2012)
      + ' '.repeat(19) // 170-188: in-flight service
      + 'EN' // 189-190: e-ticketing
      + '1600' // 191-194: creation time
      + '000002' // 195-200: serial
    expect(line.length).toBe(200)

    const result = parseCarrierRecord(line, 6)
    expect(result.type).toBe(RecordType.Carrier)
    expect(result.timeMode).toBe('U')
    expect(result.airlineDesignator).toBe('XX')
    expect(result.season).toBe('S26')
    expect(result.validFrom).toEqual(new Date(Date.UTC(2026, 2, 29)))
    expect(result.validTo).toEqual(new Date(Date.UTC(2026, 9, 25)))
    expect(result.creationDate).toEqual(new Date(Date.UTC(2026, 2, 13)))
    expect(result.titleOfData).toBe('EXAMPLE TITLE OF DATA')
    expect(result.releaseDate).toEqual(new Date(Date.UTC(2026, 2, 15)))
    expect(result.scheduleStatus).toBe('C')
    expect(result.creatorReference).toBe('REF/DEMO/2026')
    expect(result.duplicateAirlineDesignatorMarker).toBe('D')
    expect(result.secureFlightIndicator).toBe('S')
    expect(result.electronicTicketingInformation).toBe('EN')
    expect(result.creationTime).toEqual({ h: 16, m: 0 })
    expect(result.serialNumber).toBe(2)
  })
})
