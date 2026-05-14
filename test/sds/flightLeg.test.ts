import { describe, expect, it } from 'vitest'
import { parseFlightLegRecord } from '../../src/sds/records/flightLeg.ts'
import { RecordType } from '../../src/sds/types.ts'

describe('parseFlightLegRecord', () => {
  it('parses all spec fields per IATA SSIM § 7.5.3', () => {
    const line
      = '3' // 1
      + ' ' // 2: op suffix
      + 'XX ' // 3-5: airline designator
      + '0006' // 6-9: flight number
      + '01' // 10-11: IVI
      + '01' // 12-13: leg seq
      + 'S' // 14: service type
      + '31MAR26' // 15-21: period from
      + '24OCT26' // 22-28: period to
      + ' 234 67' // 29-35: days
      + ' ' // 36: freq
      + 'AAA' // 37-39: dep station
      + '0415' // 40-43: STD pax
      + '0415' // 44-47: STD acft
      + '+0300' // 48-52: UTC dep
      + 'B ' // 53-54: terminal dep
      + 'BBB' // 55-57: arr station
      + '0545' // 58-61: STA acft
      + '0545' // 62-65: STA pax
      + '+0300' // 66-70: UTC arr
      + '1 ' // 71-72: terminal arr
      + '32A' // 73-75: aircraft type
      + ' '.repeat(20) // 76-95: PRBD
      + ' '.repeat(5) // 96-100: PRBM
      + ' '.repeat(10) // 101-110: meal note
      + ' '.repeat(9) // 111-119: joint ops
      + ' '.repeat(3) // 120-122
      + ' '.repeat(5) // 123-127
      + ' ' // 128
      + ' '.repeat(3) // 129-131
      + ' '.repeat(3) // 132-134
      + ' '.repeat(3) // 135-137
      + ' '.repeat(3) // 138-140
      + ' '.repeat(4) // 141-144
      + '    ' // 145-148
      + ' ' // 149
      + ' '.repeat(11) // 150-160
      + ' ' // 161
      + ' '.repeat(11) // 162-172
      + 'C8Y150VVC8Y150      ' // 173-192
      + '  ' // 193-194
      + '000003' // 195-200
    expect(line.length).toBe(200)

    const result = parseFlightLegRecord(line, 11)
    expect(result.type).toBe(RecordType.FlightLeg)
    expect(result.airlineDesignator).toBe('XX')
    expect(result.flightNumber).toBe('0006')
    expect(result.itineraryVariationId).toBe('01')
    expect(result.legSequenceNumber).toBe('01')
    expect(result.serviceType).toBe('S')
    expect(result.periodFrom).toEqual(new Date(Date.UTC(2026, 2, 31)))
    expect(result.periodTo).toEqual(new Date(Date.UTC(2026, 9, 24)))
    expect(result.daysOfOperation).toEqual([2, 3, 4, 6, 7])
    expect(result.departure.station).toBe('AAA')
    expect(result.departure.stdPassenger).toEqual({ h: 4, m: 15 })
    expect(result.departure.utcOffsetMinutes).toBe(180)
    expect(result.departure.terminal).toBe('B')
    expect(result.arrival.station).toBe('BBB')
    expect(result.arrival.staPassenger).toEqual({ h: 5, m: 45 })
    expect(result.arrival.utcOffsetMinutes).toBe(180)
    expect(result.arrival.terminal).toBe('1')
    expect(result.aircraftType).toBe('32A')
    expect(result.aircraftConfiguration).toBe('C8Y150VVC8Y150')
    expect(result.serialNumber).toBe(3)
  })
})
