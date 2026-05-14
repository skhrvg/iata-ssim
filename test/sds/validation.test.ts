import type { CarrierRecord, FlightLegRecord, SegmentDataRecord, TrailerRecord } from '../../src/sds/index.ts'
import { describe, expect, it } from 'vitest'
import {
  parseScheduleDataSet,
  ScheduleDataSetParseError,
  validateCarrierRecord,
  validateFlightLegRecord,
  validateScheduleDataSet,
  validateSegmentDataRecord,
  validateTrailerRecord,
} from '../../src/sds/index.ts'

function carrier(over: Partial<CarrierRecord> = {}): CarrierRecord {
  return {
    type: '2',
    raw: '',
    lineNumber: 6,
    timeMode: 'U',
    airlineDesignator: 'XX',
    season: 'S26',
    validFrom: new Date(Date.UTC(2026, 0, 1)),
    validTo: new Date(Date.UTC(2026, 11, 31)),
    creationDate: new Date(Date.UTC(2025, 11, 15)),
    titleOfData: '',
    releaseDate: null,
    scheduleStatus: 'C',
    creatorReference: '',
    duplicateAirlineDesignatorMarker: ' ',
    generalInformation: '',
    secureFlightIndicator: ' ',
    inFlightServiceInformation: '',
    electronicTicketingInformation: '',
    creationTime: { h: 12, m: 0 },
    serialNumber: 2,
    ...over,
  }
}

function flightLeg(over: Partial<FlightLegRecord> = {}): FlightLegRecord {
  return {
    type: '3',
    raw: '',
    lineNumber: 10,
    operationalSuffix: ' ',
    airlineDesignator: 'XX',
    flightNumber: '0100',
    itineraryVariationId: '01',
    legSequenceNumber: '01',
    serviceType: 'J',
    periodFrom: new Date(Date.UTC(2026, 0, 1)),
    periodTo: new Date(Date.UTC(2026, 11, 31)),
    daysOfOperation: [1, 2, 3, 4, 5],
    daysOfOperationRaw: '12345  ',
    frequencyRate: '1',
    departure: {
      station: 'AAA',
      stdPassenger: { h: 8, m: 0 },
      stdAircraft: { h: 8, m: 0 },
      utcOffsetMinutes: 0,
      terminal: '',
    },
    arrival: {
      station: 'BBB',
      staAircraft: { h: 10, m: 0 },
      staPassenger: { h: 10, m: 0 },
      utcOffsetMinutes: 0,
      terminal: '',
    },
    aircraftType: '32A',
    prbd: '',
    prbm: '',
    mealServiceNote: '',
    jointOperationAirlines: [],
    mctDeparture: ' ',
    mctArrival: ' ',
    secureFlightIndicator: ' ',
    itineraryVariationOverflow: ' ',
    aircraftOwner: '',
    cockpitCrewEmployer: '',
    cabinCrewEmployer: '',
    onwardAirline: '',
    onwardFlightNumber: '',
    aircraftRotationLayover: ' ',
    onwardOperationalSuffix: ' ',
    flightTransitLayover: ' ',
    codeShareWetLease: ' ',
    trafficRestrictionCode: '',
    trcOverflow: ' ',
    aircraftConfiguration: 'C20Y180',
    dateVariation: '',
    serialNumber: 3,
    ...over,
  }
}

function segmentData(over: Partial<SegmentDataRecord> = {}): SegmentDataRecord {
  return {
    type: '4',
    raw: '',
    lineNumber: 12,
    operationalSuffix: ' ',
    airlineDesignator: 'XX',
    flightNumber: '0100',
    itineraryVariationId: '01',
    legSequenceNumber: '01',
    serviceType: 'J',
    itineraryVariationOverflow: ' ',
    boardPointIndicator: 'B',
    offPointIndicator: 'O',
    dataElementIdentifier: '050',
    boardPoint: 'AAA',
    offPoint: 'BBB',
    data: '',
    serialNumber: 4,
    ...over,
  }
}

function trailer(over: Partial<TrailerRecord> = {}): TrailerRecord {
  return {
    type: '5',
    raw: '',
    lineNumber: 100,
    airlineDesignator: 'XX',
    releaseDate: null,
    serialNumberCheckReference: 99,
    continuationEndCode: 'E',
    recordSerialNumber: 100,
    ...over,
  }
}

describe('validateCarrierRecord (§ 7.5.2)', () => {
  it('passes for spec-compliant record', () => {
    expect(validateCarrierRecord(carrier())).toEqual([])
  })

  it('rejects invalid Time Mode with correct byte range', () => {
    const issues = validateCarrierRecord(carrier({ timeMode: 'Z' }))
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toContain('Time Mode')
    expect(issues[0]!.field).toBe('timeMode')
    expect(issues[0]!.column).toBe(2)
    expect(issues[0]!.endColumn).toBe(2)
  })

  it('attaches correct byte range for date fields', () => {
    const issues = validateCarrierRecord(carrier({ validFrom: null, validTo: null }))
    const fromIssue = issues.find(i => i.field === 'validFrom')!
    const toIssue = issues.find(i => i.field === 'validTo')!
    expect(fromIssue.column).toBe(15)
    expect(fromIssue.endColumn).toBe(21)
    expect(toIssue.column).toBe(22)
    expect(toIssue.endColumn).toBe(28)
  })

  it('rejects invalid Airline Designator', () => {
    const issues = validateCarrierRecord(carrier({ airlineDesignator: 'X' }))
    expect(issues[0]!.field).toBe('airlineDesignator')
  })

  it('rejects missing mandatory dates', () => {
    const issues = validateCarrierRecord(carrier({ validFrom: null, validTo: null, creationDate: null }))
    expect(issues.map(i => i.field)).toContain('validFrom')
    expect(issues.map(i => i.field)).toContain('validTo')
    expect(issues.map(i => i.field)).toContain('creationDate')
  })

  it('rejects validFrom > validTo', () => {
    const issues = validateCarrierRecord(carrier({
      validFrom: new Date(Date.UTC(2026, 11, 1)),
      validTo: new Date(Date.UTC(2026, 0, 1)),
    }))
    expect(issues.map(i => i.field)).toContain('validFrom')
  })

  it('rejects invalid Schedule Status', () => {
    expect(validateCarrierRecord(carrier({ scheduleStatus: 'X' }))[0]!.field).toBe('scheduleStatus')
  })

  it('accepts X for Secure Flight Indicator (2012)', () => {
    expect(validateCarrierRecord(carrier({ secureFlightIndicator: 'X' }))).toEqual([])
    expect(validateCarrierRecord(carrier({ secureFlightIndicator: 'S' }))).toEqual([])
    expect(validateCarrierRecord(carrier({ secureFlightIndicator: ' ' }))).toEqual([])
  })

  it('rejects invalid Secure Flight Indicator', () => {
    expect(validateCarrierRecord(carrier({ secureFlightIndicator: 'Y' }))[0]!.field).toBe('secureFlightIndicator')
  })

  it('accepts EN/ET/blank Electronic Ticketing', () => {
    expect(validateCarrierRecord(carrier({ electronicTicketingInformation: 'EN' }))).toEqual([])
    expect(validateCarrierRecord(carrier({ electronicTicketingInformation: 'ET' }))).toEqual([])
    expect(validateCarrierRecord(carrier({ electronicTicketingInformation: '' }))).toEqual([])
  })

  it('rejects unknown Electronic Ticketing values', () => {
    expect(validateCarrierRecord(carrier({ electronicTicketingInformation: 'XX' }))[0]!.field).toBe('electronicTicketingInformation')
  })

  it('rejects missing creationTime', () => {
    expect(validateCarrierRecord(carrier({ creationTime: null }))[0]!.field).toBe('creationTime')
  })
})

describe('validateFlightLegRecord (§ 7.5.3)', () => {
  it('passes for spec-compliant record', () => {
    expect(validateFlightLegRecord(flightLeg())).toEqual([])
  })

  it('attaches nested-field byte ranges for departure/arrival', () => {
    const issues = validateFlightLegRecord(flightLeg({
      departure: { ...flightLeg().departure, stdPassenger: null },
      arrival: { ...flightLeg().arrival, utcOffsetMinutes: null },
    }))
    const depIssue = issues.find(i => i.field === 'departure.stdPassenger')!
    const arrIssue = issues.find(i => i.field === 'arrival.utcOffsetMinutes')!
    expect(depIssue.column).toBe(40)
    expect(depIssue.endColumn).toBe(43)
    expect(arrIssue.column).toBe(66)
    expect(arrIssue.endColumn).toBe(70)
  })

  it('rejects empty daysOfOperation', () => {
    expect(validateFlightLegRecord(flightLeg({ daysOfOperation: [] }))[0]!.field).toBe('daysOfOperation')
  })

  it('rejects invalid station codes', () => {
    const issues = validateFlightLegRecord(flightLeg({
      departure: { ...flightLeg().departure, station: 'AA' },
      arrival: { ...flightLeg().arrival, station: 'BBBB' },
    }))
    expect(issues.map(i => i.field)).toContain('departure.station')
    expect(issues.map(i => i.field)).toContain('arrival.station')
  })

  it('rejects missing times', () => {
    const issues = validateFlightLegRecord(flightLeg({
      departure: { ...flightLeg().departure, stdPassenger: null, stdAircraft: null, utcOffsetMinutes: null },
    }))
    expect(issues.map(i => i.field)).toContain('departure.stdPassenger')
    expect(issues.map(i => i.field)).toContain('departure.stdAircraft')
    expect(issues.map(i => i.field)).toContain('departure.utcOffsetMinutes')
  })

  it('requires PRBD or Aircraft Configuration', () => {
    const issues = validateFlightLegRecord(flightLeg({ prbd: '', aircraftConfiguration: '' }))
    expect(issues.map(i => i.field)).toContain('prbd')
    expect(issues[0]!.rule).toContain('PRBD / Aircraft Configuration')
  })

  it('passes when only PRBD is set', () => {
    expect(validateFlightLegRecord(flightLeg({ prbd: 'Y', aircraftConfiguration: '' }))).toEqual([])
  })

  it('rejects bad aircraft type code', () => {
    expect(validateFlightLegRecord(flightLeg({ aircraftType: '32' }))[0]!.field).toBe('aircraftType')
  })

  it('rejects IVI out of range', () => {
    expect(validateFlightLegRecord(flightLeg({ itineraryVariationId: '00' }))[0]!.field).toBe('itineraryVariationId')
    expect(validateFlightLegRecord(flightLeg({ itineraryVariationId: '1' }))[0]!.field).toBe('itineraryVariationId')
  })

  it('rejects period reversal', () => {
    const issues = validateFlightLegRecord(flightLeg({
      periodFrom: new Date(Date.UTC(2026, 11, 1)),
      periodTo: new Date(Date.UTC(2026, 0, 1)),
    }))
    expect(issues.map(i => i.field)).toContain('periodFrom')
  })
})

describe('validateSegmentDataRecord (§ 7.5.4)', () => {
  it('passes for spec-compliant record', () => {
    expect(validateSegmentDataRecord(segmentData())).toEqual([])
  })

  it('rejects bad DEI format', () => {
    expect(validateSegmentDataRecord(segmentData({ dataElementIdentifier: '5' }))[0]!.field).toBe('dataElementIdentifier')
    expect(validateSegmentDataRecord(segmentData({ dataElementIdentifier: 'ABC' }))[0]!.field).toBe('dataElementIdentifier')
  })

  it('rejects non-alpha point indicators', () => {
    expect(validateSegmentDataRecord(segmentData({ boardPointIndicator: '1' }))[0]!.field).toBe('boardPointIndicator')
  })
})

describe('validateTrailerRecord (§ 7.5.5)', () => {
  it('passes for spec-compliant record', () => {
    expect(validateTrailerRecord(trailer())).toEqual([])
  })

  it('rejects bad Continuation/End Code', () => {
    expect(validateTrailerRecord(trailer({ continuationEndCode: 'X' }))[0]!.field).toBe('continuationEndCode')
  })

  it('rejects mismatched serial check reference', () => {
    const issues = validateTrailerRecord(trailer({ serialNumberCheckReference: 50, recordSerialNumber: 100 }))
    expect(issues.map(i => i.field)).toContain('serialNumberCheckReference')
  })
})

describe('validateScheduleDataSet — cross-record consistency', () => {
  it('rejects flight-leg airline mismatch with carrier', () => {
    const c = carrier({ airlineDesignator: 'XX' })
    const leg = flightLeg({ airlineDesignator: 'YY' })
    const issues = validateScheduleDataSet({
      header: null,
      carriers: [{ carrier: c, flightLegs: [leg], segmentData: [], trailer: null }],
      records: [],
      warnings: [],
    })
    const mismatch = issues.find(i => i.message.includes('does not match opening Carrier'))
    expect(mismatch).toBeDefined()
    expect(mismatch!.lineNumber).toBe(leg.lineNumber)
  })

  it('rejects trailer airline mismatch with carrier', () => {
    const c = carrier({ airlineDesignator: 'XX' })
    const t = trailer({ airlineDesignator: 'ZZ' })
    const issues = validateScheduleDataSet({
      header: null,
      carriers: [{ carrier: c, flightLegs: [], segmentData: [], trailer: t }],
      records: [],
      warnings: [],
    })
    const mismatch = issues.find(i => i.recordType === '5' && i.field === 'airlineDesignator' && i.message.includes('does not match'))
    expect(mismatch).toBeDefined()
  })
})

describe('parseScheduleDataSet — strict-mode validation', () => {
  it('throws on first issue from any record type', () => {
    // Build a file where the carrier has invalid Time Mode (`Z`)
    const header = '1' + 'AIRLINE STANDARD SCHEDULE DATA SET' + ' '.repeat(156) + '001000001'
    const badCarrier = '2Z' + 'XX ' + ' '.repeat(5) + '   ' + ' ' + '01JAN26' + '31DEC26' + '15DEC25'
      + ' '.repeat(29) + ' '.repeat(7) + 'C' + ' '.repeat(35) + ' ' + ' '.repeat(60) + ' '
      + ' '.repeat(19) + '  ' + '1200' + '000002'
    expect(header.length).toBe(200)
    expect(badCarrier.length).toBe(200)
    const text = header + '\r\n' + badCarrier + '\r\n'
    expect(() => parseScheduleDataSet(text, { strict: true })).toThrow(ScheduleDataSetParseError)
  })
})
