/**
 * Spec validation for IATA SSIM Chapter 7 Schedule Data Set records.
 *
 * Validators check field-level **Status** (M = Mandatory, C = Conditional,
 * O = Optional) and value formats against the March 2012 edition of the
 * manual (§§ 7.5.1–7.5.5). Each violation is returned as a `ValidationIssue`
 * with a `rule` reference back to the spec.
 *
 * `parseScheduleDataSet` runs these validators after parsing:
 * - in **lenient** mode each issue becomes a `ScheduleDataSetWarning`;
 * - in **strict** mode the first issue is thrown as `ScheduleDataSetParseError`.
 */

import type {
  CarrierRecord,
  FlightLegRecord,
  HeaderRecord,
  ScheduleDataSet,
  SegmentDataRecord,
  TrailerRecord,
} from './types.ts'

export interface ValidationIssue {
  /** Reference back to the SSIM specification, e.g. `§ 7.5.2 Time Mode`. */
  rule: string
  /** Human-readable description of the violation. */
  message: string
  /** 1-indexed source line. */
  lineNumber: number
  /** Record type discriminator (`1`–`5`). */
  recordType: string
  /** Property name on the parsed record, when the issue is field-specific. */
  field?: string
  /** First byte of the offending field, 1-indexed inclusive. */
  column?: number
  /** Last byte of the offending field, 1-indexed inclusive. */
  endColumn?: number
}

/** Canonical Title of Contents per § 7.5.1 (bytes 2-35). */
export const EXPECTED_HEADER_TITLE = 'AIRLINE STANDARD SCHEDULE DATA SET'

/**
 * Byte ranges (1-indexed, inclusive) for each property on each record type,
 * mirroring §§ 7.5.1–7.5.5. Used by validators to attach precise column
 * information to every `ValidationIssue` for IDE/CLI jump-to-source support.
 */
export const HEADER_BYTES = {
  title: [2, 35],
  numberOfSeasons: [41, 41],
  dataSetSerialNumber: [192, 194],
  recordSerialNumber: [195, 200],
} as const

export const CARRIER_BYTES = {
  timeMode: [2, 2],
  airlineDesignator: [3, 5],
  season: [11, 13],
  validFrom: [15, 21],
  validTo: [22, 28],
  creationDate: [29, 35],
  titleOfData: [36, 64],
  releaseDate: [65, 71],
  scheduleStatus: [72, 72],
  creatorReference: [73, 107],
  duplicateAirlineDesignatorMarker: [108, 108],
  generalInformation: [109, 168],
  secureFlightIndicator: [169, 169],
  inFlightServiceInformation: [170, 188],
  electronicTicketingInformation: [189, 190],
  creationTime: [191, 194],
  serialNumber: [195, 200],
} as const

export const FLIGHT_LEG_BYTES = {
  'operationalSuffix': [2, 2],
  'airlineDesignator': [3, 5],
  'flightNumber': [6, 9],
  'itineraryVariationId': [10, 11],
  'legSequenceNumber': [12, 13],
  'serviceType': [14, 14],
  'periodFrom': [15, 21],
  'periodTo': [22, 28],
  'daysOfOperation': [29, 35],
  'frequencyRate': [36, 36],
  'departure.station': [37, 39],
  'departure.stdPassenger': [40, 43],
  'departure.stdAircraft': [44, 47],
  'departure.utcOffsetMinutes': [48, 52],
  'departure.terminal': [53, 54],
  'arrival.station': [55, 57],
  'arrival.staAircraft': [58, 61],
  'arrival.staPassenger': [62, 65],
  'arrival.utcOffsetMinutes': [66, 70],
  'arrival.terminal': [71, 72],
  'aircraftType': [73, 75],
  'prbd': [76, 95],
  'prbm': [96, 100],
  'mealServiceNote': [101, 110],
  'jointOperationAirlines': [111, 119],
  'mctDeparture': [120, 120],
  'mctArrival': [121, 121],
  'secureFlightIndicator': [122, 122],
  'itineraryVariationOverflow': [128, 128],
  'aircraftOwner': [129, 131],
  'cockpitCrewEmployer': [132, 134],
  'cabinCrewEmployer': [135, 137],
  'onwardAirline': [138, 140],
  'onwardFlightNumber': [141, 144],
  'aircraftRotationLayover': [145, 145],
  'onwardOperationalSuffix': [146, 146],
  'flightTransitLayover': [148, 148],
  'codeShareWetLease': [149, 149],
  'trafficRestrictionCode': [150, 160],
  'trcOverflow': [161, 161],
  'aircraftConfiguration': [173, 192],
  'dateVariation': [193, 194],
  'serialNumber': [195, 200],
} as const

export const SEGMENT_BYTES = {
  operationalSuffix: [2, 2],
  airlineDesignator: [3, 5],
  flightNumber: [6, 9],
  itineraryVariationId: [10, 11],
  legSequenceNumber: [12, 13],
  serviceType: [14, 14],
  itineraryVariationOverflow: [28, 28],
  boardPointIndicator: [29, 29],
  offPointIndicator: [30, 30],
  dataElementIdentifier: [31, 33],
  boardPoint: [34, 36],
  offPoint: [37, 39],
  data: [40, 194],
  serialNumber: [195, 200],
} as const

export const TRAILER_BYTES = {
  airlineDesignator: [3, 5],
  releaseDate: [6, 12],
  serialNumberCheckReference: [188, 193],
  continuationEndCode: [194, 194],
  recordSerialNumber: [195, 200],
} as const

type ByteRange = readonly [number, number]
type RecordByteMap = Record<string, ByteRange>

const IATA_AIRLINE_RE = /^[A-Z\d]{2,3}$/
const FLIGHT_NUMBER_RE = /^\d{1,4}$/
const TWO_DIGIT_RE = /^\d{2}$/
const SINGLE_ALPHA_RE = /^[A-Z]$/
const STATION_RE = /^[A-Z]{3}$/
const AIRCRAFT_TYPE_RE = /^[A-Z\d]{3}$/
const DEI_RE = /^\d{3}$/

function addAt(
  issues: ValidationIssue[],
  rule: string,
  message: string,
  record: { lineNumber: number, type: string },
  byteMap: RecordByteMap,
  field: string,
): void {
  const range = byteMap[field]
  issues.push({
    rule,
    message,
    lineNumber: record.lineNumber,
    recordType: record.type,
    field,
    column: range?.[0],
    endColumn: range?.[1],
  })
}

/** Validate § 7.5.1 Header Record. */
export function validateHeaderRecord(r: HeaderRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (r.title !== EXPECTED_HEADER_TITLE) {
    addAt(
      issues,
      '§ 7.5.1 Title of Contents',
      `Expected title "${EXPECTED_HEADER_TITLE}", got "${r.title}". File may not be a standard SSIM Schedule Data Set.`,
      r,
      HEADER_BYTES,
      'title',
    )
  }
  if (r.recordSerialNumber !== 1) {
    addAt(
      issues,
      '§ 7.5.1 Record Serial Number',
      `Header record serial number must be 1 (spec: "Always 000001"), got ${r.recordSerialNumber}.`,
      r,
      HEADER_BYTES,
      'recordSerialNumber',
    )
  }
  return issues
}

/** Validate § 7.5.2 Carrier Record. */
export function validateCarrierRecord(r: CarrierRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const at = (rule: string, message: string, field: string): void =>
    addAt(issues, rule, message, r, CARRIER_BYTES, field)

  if (r.timeMode !== 'U' && r.timeMode !== 'L')
    at('§ 7.5.2 Time Mode', `Time Mode must be "U" (UTC) or "L" (Local), got "${r.timeMode}".`, 'timeMode')

  if (!IATA_AIRLINE_RE.test(r.airlineDesignator))
    at('§ 7.5.2 Airline Designator', `Airline Designator must be 2-3 alphanumeric characters, got "${r.airlineDesignator}".`, 'airlineDesignator')

  if (r.validFrom === null)
    at('§ 7.5.2 Period of Schedule Validity', 'Period validity start date (bytes 15-21) is mandatory and must parse as DDMMMYY.', 'validFrom')
  if (r.validTo === null)
    at('§ 7.5.2 Period of Schedule Validity', 'Period validity end date (bytes 22-28) is mandatory and must parse as DDMMMYY.', 'validTo')
  if (r.validFrom !== null && r.validTo !== null && r.validFrom > r.validTo)
    at('§ 7.5.2 Period of Schedule Validity', `Period validity start ${r.validFrom.toISOString().slice(0, 10)} is after end ${r.validTo.toISOString().slice(0, 10)}.`, 'validFrom')

  if (r.creationDate === null)
    at('§ 7.5.2 Creation Date', 'Creation Date (bytes 29-35) is mandatory and must parse as DDMMMYY.', 'creationDate')

  if (r.scheduleStatus !== 'P' && r.scheduleStatus !== 'C')
    at('§ 7.5.2 Schedule Status', `Schedule Status must be "P" (Planned) or "C" (Current), got "${r.scheduleStatus}".`, 'scheduleStatus')

  if (r.secureFlightIndicator !== ' ' && r.secureFlightIndicator !== 'S' && r.secureFlightIndicator !== 'X')
    at('§ 7.5.2 Secure Flight Indicator', `Secure Flight Indicator (byte 169, effective 1 Oct 2012) must be blank, "S", or "X", got "${r.secureFlightIndicator}".`, 'secureFlightIndicator')

  const eti = r.electronicTicketingInformation
  if (eti !== '' && eti !== 'EN' && eti !== 'ET')
    at('§ 7.5.2 Electronic Ticketing Information', `Electronic Ticketing Information must be blank, "EN", or "ET", got "${eti}".`, 'electronicTicketingInformation')

  if (r.creationTime === null)
    at('§ 7.5.2 Creation Time', 'Creation Time (bytes 191-194) is mandatory and must parse as HHMM.', 'creationTime')

  if (r.serialNumber < 2)
    at('§ 7.5.2 Record Serial Number', `Carrier serial number must be > 1 (one greater than the Header serial), got ${r.serialNumber}.`, 'serialNumber')

  return issues
}

/** Validate § 7.5.3 Flight Leg Record. */
export function validateFlightLegRecord(r: FlightLegRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const at = (rule: string, message: string, field: string): void =>
    addAt(issues, rule, message, r, FLIGHT_LEG_BYTES, field)

  if (!IATA_AIRLINE_RE.test(r.airlineDesignator))
    at('§ 7.5.3 Airline Designator', `Airline Designator must be 2-3 alphanumeric characters, got "${r.airlineDesignator}".`, 'airlineDesignator')
  if (!FLIGHT_NUMBER_RE.test(r.flightNumber))
    at('§ 7.5.3 Flight Number', `Flight Number must be 1-4 digits (right-justified, blank-filled), got "${r.flightNumber}".`, 'flightNumber')
  if (!TWO_DIGIT_RE.test(r.itineraryVariationId) || Number.parseInt(r.itineraryVariationId, 10) < 1)
    at('§ 7.5.3 Itinerary Variation Identifier', `Itinerary Variation Identifier must be between 01 and 99, got "${r.itineraryVariationId}".`, 'itineraryVariationId')
  if (!TWO_DIGIT_RE.test(r.legSequenceNumber) || Number.parseInt(r.legSequenceNumber, 10) < 1)
    at('§ 7.5.3 Leg Sequence Number', `Leg Sequence Number must be between 01 and 99, got "${r.legSequenceNumber}".`, 'legSequenceNumber')
  if (!SINGLE_ALPHA_RE.test(r.serviceType))
    at('§ 7.5.3 Service Type', `Service Type must be a single uppercase letter, got "${r.serviceType}".`, 'serviceType')
  if (r.periodFrom === null)
    at('§ 7.5.3 Period of Operation', 'Period of Operation start (bytes 15-21) is mandatory and must parse as DDMMMYY.', 'periodFrom')
  if (r.periodTo === null)
    at('§ 7.5.3 Period of Operation', 'Period of Operation end (bytes 22-28) is mandatory and must parse as DDMMMYY.', 'periodTo')
  if (r.periodFrom !== null && r.periodTo !== null && r.periodFrom > r.periodTo)
    at('§ 7.5.3 Period of Operation', `Period of Operation start ${r.periodFrom.toISOString().slice(0, 10)} is after end ${r.periodTo.toISOString().slice(0, 10)}.`, 'periodFrom')
  if (r.daysOfOperation.length === 0)
    at('§ 7.5.3 Days of Operation', `Days of Operation (bytes 29-35) is mandatory; at least one day must be set. Raw: "${r.daysOfOperationRaw}".`, 'daysOfOperation')

  // Departure block
  if (!STATION_RE.test(r.departure.station))
    at('§ 7.5.3 Departure Station', `Departure Station must be a 3-character IATA code, got "${r.departure.station}".`, 'departure.station')
  if (r.departure.stdPassenger === null)
    at('§ 7.5.3 Passenger STD', 'Scheduled Time of Passenger Departure (bytes 40-43) is mandatory.', 'departure.stdPassenger')
  if (r.departure.stdAircraft === null)
    at('§ 7.5.3 Aircraft STD', 'Scheduled Time of Aircraft Departure (bytes 44-47) is mandatory.', 'departure.stdAircraft')
  if (r.departure.utcOffsetMinutes === null)
    at('§ 7.5.3 UTC/Local Time Variation', 'UTC/Local Time Variation for Departure Station (bytes 48-52) is mandatory and must be ±HHMM.', 'departure.utcOffsetMinutes')

  // Arrival block
  if (!STATION_RE.test(r.arrival.station))
    at('§ 7.5.3 Arrival Station', `Arrival Station must be a 3-character IATA code, got "${r.arrival.station}".`, 'arrival.station')
  if (r.arrival.staAircraft === null)
    at('§ 7.5.3 Aircraft STA', 'Scheduled Time of Aircraft Arrival (bytes 58-61) is mandatory.', 'arrival.staAircraft')
  if (r.arrival.staPassenger === null)
    at('§ 7.5.3 Passenger STA', 'Scheduled Time of Passenger Arrival (bytes 62-65) is mandatory.', 'arrival.staPassenger')
  if (r.arrival.utcOffsetMinutes === null)
    at('§ 7.5.3 UTC/Local Time Variation', 'UTC/Local Time Variation for Arrival Station (bytes 66-70) is mandatory and must be ±HHMM.', 'arrival.utcOffsetMinutes')

  if (!AIRCRAFT_TYPE_RE.test(r.aircraftType))
    at('§ 7.5.3 Aircraft Type', `Aircraft Type must be a 3-character IATA aircraft code, got "${r.aircraftType}".`, 'aircraftType')

  // PRBD OR Aircraft Configuration is mandatory (one or the other)
  if (r.prbd === '' && r.aircraftConfiguration === '') {
    at(
      '§ 7.5.3 PRBD / Aircraft Configuration',
      'Either Passenger Reservations Booking Designator (bytes 76-95) or Aircraft Configuration/Version (bytes 173-192) is mandatory; both are blank.',
      'prbd',
    )
  }

  if (r.secureFlightIndicator !== ' ' && r.secureFlightIndicator !== 'S' && r.secureFlightIndicator !== 'X')
    at('§ 7.5.3 Secure Flight Indicator', `Secure Flight Indicator (byte 122) must be blank, "S", or "X", got "${r.secureFlightIndicator}".`, 'secureFlightIndicator')

  if (r.serialNumber < 1)
    at('§ 7.5.3 Record Serial Number', `Record serial number must be > 0, got ${r.serialNumber}.`, 'serialNumber')

  return issues
}

/** Validate § 7.5.4 Segment Data Record. */
export function validateSegmentDataRecord(r: SegmentDataRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const at = (rule: string, message: string, field: string): void =>
    addAt(issues, rule, message, r, SEGMENT_BYTES, field)

  if (!IATA_AIRLINE_RE.test(r.airlineDesignator))
    at('§ 7.5.4 Airline Designator', `Airline Designator must be 2-3 alphanumeric characters, got "${r.airlineDesignator}".`, 'airlineDesignator')
  if (!FLIGHT_NUMBER_RE.test(r.flightNumber))
    at('§ 7.5.4 Flight Number', `Flight Number must be 1-4 digits, got "${r.flightNumber}".`, 'flightNumber')
  if (!TWO_DIGIT_RE.test(r.itineraryVariationId) || Number.parseInt(r.itineraryVariationId, 10) < 1)
    at('§ 7.5.4 Itinerary Variation Identifier', `Itinerary Variation Identifier must be between 01 and 99, got "${r.itineraryVariationId}".`, 'itineraryVariationId')
  if (!TWO_DIGIT_RE.test(r.legSequenceNumber) || Number.parseInt(r.legSequenceNumber, 10) < 1)
    at('§ 7.5.4 Leg Sequence Number', `Leg Sequence Number must be between 01 and 99, got "${r.legSequenceNumber}".`, 'legSequenceNumber')
  if (!SINGLE_ALPHA_RE.test(r.serviceType))
    at('§ 7.5.4 Service Type', `Service Type must be a single uppercase letter, got "${r.serviceType}".`, 'serviceType')
  if (!SINGLE_ALPHA_RE.test(r.boardPointIndicator))
    at('§ 7.5.4 Board Point Indicator', `Board Point Indicator must be a single uppercase letter, got "${r.boardPointIndicator}".`, 'boardPointIndicator')
  if (!SINGLE_ALPHA_RE.test(r.offPointIndicator))
    at('§ 7.5.4 Off Point Indicator', `Off Point Indicator must be a single uppercase letter, got "${r.offPointIndicator}".`, 'offPointIndicator')
  if (!DEI_RE.test(r.dataElementIdentifier))
    at('§ 7.5.4 Data Element Identifier', `Data Element Identifier must be 3 digits (right-justified, zero-filled), got "${r.dataElementIdentifier}".`, 'dataElementIdentifier')
  if (!STATION_RE.test(r.boardPoint))
    at('§ 7.5.4 Board Point', `Board Point must be a 3-character IATA code, got "${r.boardPoint}".`, 'boardPoint')
  if (!STATION_RE.test(r.offPoint))
    at('§ 7.5.4 Off Point', `Off Point must be a 3-character IATA code, got "${r.offPoint}".`, 'offPoint')
  if (r.serialNumber < 1)
    at('§ 7.5.4 Record Serial Number', `Record serial number must be > 0, got ${r.serialNumber}.`, 'serialNumber')

  return issues
}

/** Validate § 7.5.5 Trailer Record. */
export function validateTrailerRecord(r: TrailerRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const at = (rule: string, message: string, field: string): void =>
    addAt(issues, rule, message, r, TRAILER_BYTES, field)

  if (!IATA_AIRLINE_RE.test(r.airlineDesignator))
    at('§ 7.5.5 Airline Designator', `Airline Designator must be 2-3 alphanumeric characters, got "${r.airlineDesignator}".`, 'airlineDesignator')
  if (r.serialNumberCheckReference < 1)
    at('§ 7.5.5 Serial Number Check Reference', `Serial Number Check Reference (bytes 188-193) must be > 0, got ${r.serialNumberCheckReference}.`, 'serialNumberCheckReference')
  if (r.continuationEndCode !== 'C' && r.continuationEndCode !== 'E')
    at('§ 7.5.5 Continuation/End Code', `Continuation/End Code (byte 194) must be "C" or "E", got "${r.continuationEndCode}".`, 'continuationEndCode')
  if (r.recordSerialNumber < 1)
    at('§ 7.5.5 Record Serial Number', `Record serial number must be > 0, got ${r.recordSerialNumber}.`, 'recordSerialNumber')
  if (
    r.serialNumberCheckReference !== 0
    && r.recordSerialNumber !== 0
    && r.serialNumberCheckReference !== r.recordSerialNumber - 1
  ) {
    at(
      '§ 7.5.5 Serial Number Check Reference',
      `Serial Number Check Reference (${r.serialNumberCheckReference}) must equal Record Serial Number (${r.recordSerialNumber}) minus 1.`,
      'serialNumberCheckReference',
    )
  }

  return issues
}

/**
 * Validate cross-record consistency within a Schedule Data Set:
 * carrier-designator alignment between Type 2/3/4/5 records.
 */
export function validateScheduleDataSet(file: ScheduleDataSet): ValidationIssue[] {
  const all: ValidationIssue[] = []

  if (file.header)
    all.push(...validateHeaderRecord(file.header))

  for (const block of file.carriers) {
    const carrierAirline = block.carrier.airlineDesignator
    all.push(...validateCarrierRecord(block.carrier))

    for (const leg of block.flightLegs) {
      all.push(...validateFlightLegRecord(leg))
      if (leg.airlineDesignator !== carrierAirline) {
        addAt(
          all,
          '§ 7.5.3 Airline Designator',
          `Flight leg airline "${leg.airlineDesignator}" does not match opening Carrier Record "${carrierAirline}".`,
          leg,
          FLIGHT_LEG_BYTES,
          'airlineDesignator',
        )
      }
    }

    for (const seg of block.segmentData) {
      all.push(...validateSegmentDataRecord(seg))
      if (seg.airlineDesignator !== carrierAirline) {
        addAt(
          all,
          '§ 7.5.4 Airline Designator',
          `Segment data airline "${seg.airlineDesignator}" does not match opening Carrier Record "${carrierAirline}".`,
          seg,
          SEGMENT_BYTES,
          'airlineDesignator',
        )
      }
    }

    if (block.trailer) {
      all.push(...validateTrailerRecord(block.trailer))
      if (block.trailer.airlineDesignator !== carrierAirline) {
        addAt(
          all,
          '§ 7.5.5 Airline Designator',
          `Trailer airline "${block.trailer.airlineDesignator}" does not match opening Carrier Record "${carrierAirline}".`,
          block.trailer,
          TRAILER_BYTES,
          'airlineDesignator',
        )
      }
    }
  }

  return all
}
