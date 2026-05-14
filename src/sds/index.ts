/**
 * IATA SSIM **Chapter 7** — Schedule Data Set (SDS).
 *
 * The fixed-width 200-byte file format airlines use to publish full
 * schedules. Five record types (1–5) plus de-facto zero-filler lines.
 *
 * Spec: SSIM Chapter 7 §§ 7.5.1–7.5.5 (validated against the
 * March 2011 and March 2012 editions).
 */

export { ScheduleDataSetParseError } from './errors.ts'
export type { ScheduleDataSetParseErrorContext } from './errors.ts'

export {
  parseScheduleDataSet,
  parseScheduleDataSetLine,
  parseScheduleDataSetRecords,
} from './parse.ts'

export { parseCarrierRecord } from './records/carrier.ts'
export { parseFlightLegRecord } from './records/flightLeg.ts'

export { parseHeaderRecord } from './records/header.ts'
export { parseSegmentDataRecord } from './records/segmentData.ts'
export { parseTrailerRecord } from './records/trailer.ts'
export { isZeroFillerLine, parseZeroFiller } from './records/zeroFiller.ts'
export type {
  BaseRecord,
  CarrierBlock,
  CarrierRecord,
  FlightArrivalEndpoint,
  FlightDepartureEndpoint,
  FlightLegRecord,
  HeaderRecord,
  ParseOptions,
  ScheduleDataSet,
  ScheduleDataSetRecord,
  ScheduleDataSetWarning,
  SegmentDataRecord,
  TrailerRecord,
  UnknownRecord,
  ZeroFiller,
} from './types.ts'
export { RecordType } from './types.ts'

export {
  EXPECTED_HEADER_TITLE,
  validateCarrierRecord,
  validateFlightLegRecord,
  validateHeaderRecord,
  validateScheduleDataSet,
  validateSegmentDataRecord,
  validateTrailerRecord,
} from './validation.ts'
export type { ValidationIssue } from './validation.ts'
