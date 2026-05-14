import type { IataTime } from '../utils/time.ts'

/**
 * Record-type discriminator. Standard values `1`–`5` come from IATA SSIM
 * Chapter 7 § 7.4; `0` (zero filler) is a de-facto convention; `?` is a
 * library-side marker for lines whose first byte is unrecognized.
 */
export const RecordType = {
  Header: '1',
  Carrier: '2',
  FlightLeg: '3',
  SegmentData: '4',
  Trailer: '5',
  Zero: '0',
  Unknown: '?',
} as const

// eslint-disable-next-line ts/no-redeclare -- enum-style const+type pairing exposed as the public API
export type RecordType = typeof RecordType[keyof typeof RecordType]

export interface BaseRecord {
  type: RecordType
  raw: string
  lineNumber: number
}

/** Schedule Data Set Header Record — § 7.5.1. */
export interface HeaderRecord extends BaseRecord {
  type: typeof RecordType.Header
  /** Title of Contents — always "AIRLINE STANDARD SCHEDULE DATA SET" (bytes 2-35). */
  title: string
  /** Number of seasons that follow (byte 41, optional). */
  numberOfSeasons: string
  /** Data Set Serial Number (bytes 192-194). */
  dataSetSerialNumber: string
  /** Record Serial Number (bytes 195-200) — always 000001 for the header. */
  recordSerialNumber: number
}

/** Schedule Data Set Carrier Record — § 7.5.2. */
export interface CarrierRecord extends BaseRecord {
  type: typeof RecordType.Carrier
  /** `U` = UTC, `L` = local (byte 2). */
  timeMode: string
  /** IATA airline designator (bytes 3-5). */
  airlineDesignator: string
  /** Season identifier, e.g. `S26`, `W26` (bytes 11-13). */
  season: string
  /** First date of schedule validity (bytes 15-21). */
  validFrom: Date | null
  /** Last date of schedule validity (bytes 22-28). */
  validTo: Date | null
  /** Data set creation date (bytes 29-35). */
  creationDate: Date | null
  /** Free-text data title (bytes 36-64). */
  titleOfData: string
  /** Release (sell) date (bytes 65-71, optional). */
  releaseDate: Date | null
  /** `P` (planned) or `C` (current) — byte 72. */
  scheduleStatus: string
  /** Free-text creator reference (bytes 73-107, optional). */
  creatorReference: string
  /** Duplicate Airline Designator Marker (byte 108, conditional). */
  duplicateAirlineDesignatorMarker: string
  /** Free-text general information (bytes 109-168, optional). */
  generalInformation: string
  /**
   * Secure Flight Indicator at carrier level (byte 169, optional).
   *
   * Added in IATA SSIM March 2012, effective 1 October 2012. Values:
   * - `S` — TSA Secure Flight regulations apply to all flights
   * - `X` — TSA regulations do not apply (overrides Type 3 byte 122 default)
   * - blank — not specified
   */
  secureFlightIndicator: string
  /** In-flight service defaults (bytes 170-188, optional). */
  inFlightServiceInformation: string
  /** `EN` or `ET` — electronic ticketing default (bytes 189-190, optional). */
  electronicTicketingInformation: string
  /** Data set creation time (bytes 191-194). */
  creationTime: IataTime | null
  /** Record serial number (bytes 195-200). */
  serialNumber: number
}

export interface FlightDepartureEndpoint {
  station: string
  stdPassenger: IataTime | null
  stdAircraft: IataTime | null
  utcOffsetMinutes: number | null
  terminal: string
}

export interface FlightArrivalEndpoint {
  station: string
  staAircraft: IataTime | null
  staPassenger: IataTime | null
  utcOffsetMinutes: number | null
  terminal: string
}

/** Schedule Data Set Flight Leg Record — § 7.5.3. */
export interface FlightLegRecord extends BaseRecord {
  type: typeof RecordType.FlightLeg
  operationalSuffix: string
  airlineDesignator: string
  flightNumber: string
  itineraryVariationId: string
  legSequenceNumber: string
  serviceType: string
  periodFrom: Date | null
  periodTo: Date | null
  daysOfOperation: number[]
  daysOfOperationRaw: string
  frequencyRate: string
  departure: FlightDepartureEndpoint
  arrival: FlightArrivalEndpoint
  aircraftType: string
  prbd: string
  prbm: string
  mealServiceNote: string
  jointOperationAirlines: string[]
  mctDeparture: string
  mctArrival: string
  secureFlightIndicator: string
  itineraryVariationOverflow: string
  aircraftOwner: string
  cockpitCrewEmployer: string
  cabinCrewEmployer: string
  onwardAirline: string
  onwardFlightNumber: string
  aircraftRotationLayover: string
  onwardOperationalSuffix: string
  flightTransitLayover: string
  codeShareWetLease: string
  trafficRestrictionCode: string
  trcOverflow: string
  aircraftConfiguration: string
  dateVariation: string
  serialNumber: number
}

/** Schedule Data Set Segment Data Record — § 7.5.4. */
export interface SegmentDataRecord extends BaseRecord {
  type: typeof RecordType.SegmentData
  operationalSuffix: string
  airlineDesignator: string
  flightNumber: string
  itineraryVariationId: string
  legSequenceNumber: string
  serviceType: string
  itineraryVariationOverflow: string
  boardPointIndicator: string
  offPointIndicator: string
  dataElementIdentifier: string
  boardPoint: string
  offPoint: string
  data: string
  serialNumber: number
}

/** Schedule Data Set Trailer Record — § 7.5.5. */
export interface TrailerRecord extends BaseRecord {
  type: typeof RecordType.Trailer
  airlineDesignator: string
  releaseDate: Date | null
  /**
   * Serial Number Check Reference (bytes 188-193) — equals the Record Serial
   * Number of the previous record. Used for sequence integrity verification.
   */
  serialNumberCheckReference: number
  /** `C` if another Carrier/Trailer pair follows, `E` if end of file (byte 194). */
  continuationEndCode: string
  recordSerialNumber: number
}

export interface ZeroFiller extends BaseRecord {
  type: typeof RecordType.Zero
}

export interface UnknownRecord extends BaseRecord {
  type: typeof RecordType.Unknown
  recordTypeChar: string
}

export type ScheduleDataSetRecord
  = | HeaderRecord
    | CarrierRecord
    | FlightLegRecord
    | SegmentDataRecord
    | TrailerRecord
    | ZeroFiller
    | UnknownRecord

export interface CarrierBlock {
  carrier: CarrierRecord
  flightLegs: FlightLegRecord[]
  segmentData: SegmentDataRecord[]
  trailer: TrailerRecord | null
}

/** Result of parsing an entire Schedule Data Set (Chapter 7 file). */
export interface ScheduleDataSet {
  header: HeaderRecord | null
  carriers: CarrierBlock[]
  records: ScheduleDataSetRecord[]
  warnings: ScheduleDataSetWarning[]
}

export interface ScheduleDataSetWarning {
  message: string
  lineNumber: number
  line: string
  /** Spec reference if the warning came from `validateScheduleDataSet`. */
  rule?: string
  /** Record type discriminator (`1`–`5`/`?`). */
  recordType?: string
  /** Field name on the offending record. */
  field?: string
  /** First byte (1-indexed, inclusive) of the offending range. */
  column?: number
  /** Last byte (1-indexed, inclusive) of the offending range. */
  endColumn?: number
}

export interface ParseOptions {
  /**
   * If true, throw `ScheduleDataSetParseError` on unknown record types or
   * malformed records. Default: false — collect warnings instead.
   */
  strict?: boolean
  /**
   * Optional callback fired for each warning.
   */
  onWarning?: (warning: ScheduleDataSetWarning) => void
}
