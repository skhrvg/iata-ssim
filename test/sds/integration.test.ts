import { describe, expect, it } from 'vitest'
import { parseScheduleDataSet } from '../../src/sds/parse.ts'
import { RecordType } from '../../src/sds/types.ts'

function expect200(line: string, label: string): void {
  if (line.length !== 200)
    throw new Error(`${label} line length is ${line.length}, expected 200`)
}

function buildHeaderLine(): string {
  const line
    = '1' // 1: record type
    + 'AIRLINE STANDARD SCHEDULE DATA SET' // 2-35: title
    + ' '.repeat(156) // 36-191: spare
    + '001' // 192-194: data set serial
    + '000001' // 195-200: record serial (always 1 per spec)
  expect200(line, 'header')
  return line
}

function buildCarrierLine(): string {
  const line
    = '2' // 1
    + 'U' // 2
    + 'XX ' // 3-5
    + ' '.repeat(5) // 6-10
    + 'S26' // 11-13
    + ' ' // 14
    + '01JAN26' // 15-21
    + '31DEC26' // 22-28
    + '15DEC25' // 29-35
    + 'SYNTHETIC TEST DATA          ' // 36-64 (29 chars)
    + '15DEC25' // 65-71
    + 'C' // 72
    + ' '.repeat(35) // 73-107
    + ' ' // 108
    + ' '.repeat(60) // 109-168
    + ' ' // 169
    + ' '.repeat(19) // 170-188
    + ' '.repeat(2) // 189-190
    + '1200' // 191-194
    + '000002' // 195-200
  expect200(line, 'carrier')
  return line
}

interface SyntheticLeg {
  flightNumber: string
  from: string
  to: string
  days: string
  dep: string
  arr: string
  depTime: string
  arrTime: string
  serial: number
}

function buildLegLine(input: SyntheticLeg): string {
  const line
    = '3'
    + ' '
    + 'XX '
    + input.flightNumber
    + '01' // IVI
    + '01' // leg seq
    + 'J' // service type
    + input.from
    + input.to
    + input.days
    + '1' // freq
    + input.dep
    + input.depTime
    + input.depTime
    + '+0000'
    + '  ' // terminal dep
    + input.arr
    + input.arrTime
    + input.arrTime
    + '+0000'
    + '  ' // terminal arr
    + '32A'
    + ' '.repeat(20) // PRBD
    + ' '.repeat(5) // PRBM
    + ' '.repeat(10) // meal
    + ' '.repeat(9) // joint ops
    + ' '.repeat(3) // 120-122
    + ' '.repeat(5) // 123-127
    + ' ' // 128
    + ' '.repeat(3)
    + ' '.repeat(3)
    + ' '.repeat(3)
    + ' '.repeat(3)
    + ' '.repeat(4)
    + '    ' // 145-148
    + ' '
    + ' '.repeat(11)
    + ' '
    + ' '.repeat(11)
    + 'C20Y180             ' // 173-192: aircraft config (20 chars)
    + '  '
    + input.serial.toString().padStart(6, '0')
  expect200(line, `leg ${input.flightNumber}`)
  return line
}

function buildTrailerLine(): string {
  const line
    = '5'
    + ' '
    + 'XX '
    + ' '.repeat(7) // 6-12: release date (blank)
    + ' '.repeat(175) // 13-187: spare
    + '000005' // 188-193: serial check ref
    + 'E' // 194
    + '000006' // 195-200
  expect200(line, 'trailer')
  return line
}

function buildSyntheticDataSet(): string {
  const filler = '0'.repeat(200)
  return [
    buildHeaderLine(),
    filler,
    filler,
    buildCarrierLine(),
    buildLegLine({ flightNumber: '0100', from: '01JAN26', to: '31DEC26', days: '12345  ', dep: 'AAA', arr: 'BBB', depTime: '0800', arrTime: '1000', serial: 3 }),
    buildLegLine({ flightNumber: '0200', from: '01JAN26', to: '31MAR26', days: '   4 67', dep: 'AAA', arr: 'CCC', depTime: '1400', arrTime: '1530', serial: 4 }),
    buildLegLine({ flightNumber: '0300', from: '01APR26', to: '31DEC26', days: '1234567', dep: 'BBB', arr: 'AAA', depTime: '0700', arrTime: '0900', serial: 5 }),
    buildTrailerLine(),
    filler,
    filler,
    filler,
  ].join('\r\n') + '\r\n'
}

describe('integration: parseScheduleDataSet on synthetic fixture', () => {
  const text = buildSyntheticDataSet()
  const file = parseScheduleDataSet(text)

  it('has header', () => {
    expect(file.header).not.toBeNull()
    expect(file.header?.type).toBe(RecordType.Header)
    expect(file.header?.title).toContain('AIRLINE STANDARD SCHEDULE')
  })

  it('has exactly one carrier block', () => {
    expect(file.carriers).toHaveLength(1)
  })

  it('carrier metadata is parsed', () => {
    const block = file.carriers[0]!
    expect(block.carrier.airlineDesignator).toBe('XX')
    expect(block.carrier.timeMode).toBe('U')
    expect(block.carrier.season).toBe('S26')
    expect(block.carrier.validFrom).toEqual(new Date(Date.UTC(2026, 0, 1)))
    expect(block.carrier.validTo).toEqual(new Date(Date.UTC(2026, 11, 31)))
  })

  it('has three flight legs', () => {
    expect(file.carriers[0]!.flightLegs).toHaveLength(3)
  })

  it('first leg parses correctly', () => {
    const leg = file.carriers[0]!.flightLegs[0]!
    expect(leg.airlineDesignator).toBe('XX')
    expect(leg.flightNumber).toBe('0100')
    expect(leg.departure.station).toBe('AAA')
    expect(leg.arrival.station).toBe('BBB')
    expect(leg.periodFrom).toEqual(new Date(Date.UTC(2026, 0, 1)))
    expect(leg.daysOfOperation).toEqual([1, 2, 3, 4, 5])
    expect(leg.departure.stdPassenger).toEqual({ h: 8, m: 0 })
    expect(leg.arrival.staPassenger).toEqual({ h: 10, m: 0 })
  })

  it('weekend-only leg has correct days', () => {
    expect(file.carriers[0]!.flightLegs[1]!.daysOfOperation).toEqual([4, 6, 7])
  })

  it('every-day leg has all seven days', () => {
    expect(file.carriers[0]!.flightLegs[2]!.daysOfOperation).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('every leg preserves raw 200-char line', () => {
    for (const leg of file.carriers[0]!.flightLegs)
      expect(leg.raw.length).toBe(200)
  })

  it('has trailer with end-of-file marker and serial check', () => {
    const trailer = file.carriers[0]!.trailer
    expect(trailer).not.toBeNull()
    expect(trailer!.airlineDesignator).toBe('XX')
    expect(trailer!.continuationEndCode).toBe('E')
    expect(trailer!.serialNumberCheckReference).toBe(5)
    expect(trailer!.recordSerialNumber).toBe(6)
  })

  it('counts records by type', () => {
    const counts: Record<string, number> = {}
    for (const r of file.records)
      counts[r.type] = (counts[r.type] ?? 0) + 1
    expect(counts[RecordType.Header]).toBe(1)
    expect(counts[RecordType.Carrier]).toBe(1)
    expect(counts[RecordType.FlightLeg]).toBe(3)
    expect(counts[RecordType.Trailer]).toBe(1)
    expect(counts[RecordType.Zero]).toBe(5)
  })

  it('records no warnings on well-formed input', () => {
    if (file.warnings.length > 0)
      console.error('Unexpected warnings:', JSON.stringify(file.warnings, null, 2))
    expect(file.warnings).toHaveLength(0)
  })
})
