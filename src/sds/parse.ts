import type {
  CarrierBlock,
  CarrierRecord,
  FlightLegRecord,
  HeaderRecord,
  ParseOptions,
  ScheduleDataSet,
  ScheduleDataSetRecord,
  ScheduleDataSetWarning,
  SegmentDataRecord,
} from './types.ts'
import { ScheduleDataSetParseError } from './errors.ts'
import { parseCarrierRecord } from './records/carrier.ts'
import { parseFlightLegRecord } from './records/flightLeg.ts'
import { parseHeaderRecord } from './records/header.ts'
import { parseSegmentDataRecord } from './records/segmentData.ts'
import { parseTrailerRecord } from './records/trailer.ts'
import { isZeroFillerLine, parseZeroFiller } from './records/zeroFiller.ts'
import { RecordType } from './types.ts'
import { validateScheduleDataSet } from './validation.ts'

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
}

/**
 * Parse a single Schedule Data Set line (200 bytes) into a typed record.
 * Throws `ScheduleDataSetParseError` if `strict` is true and the line is
 * unrecognized.
 */
export function parseScheduleDataSetLine(
  line: string,
  lineNumber = 1,
  options: ParseOptions = {},
): ScheduleDataSetRecord {
  if (line.length === 0) {
    throw new ScheduleDataSetParseError('Empty line', { lineNumber, line })
  }

  if (isZeroFillerLine(line)) {
    return parseZeroFiller(line, lineNumber)
  }

  const recordTypeChar = line[0]!

  switch (recordTypeChar) {
    case RecordType.Header:
      return parseHeaderRecord(line, lineNumber)
    case RecordType.Carrier:
      return parseCarrierRecord(line, lineNumber)
    case RecordType.FlightLeg:
      return parseFlightLegRecord(line, lineNumber)
    case RecordType.SegmentData:
      return parseSegmentDataRecord(line, lineNumber)
    case RecordType.Trailer:
      return parseTrailerRecord(line, lineNumber)
    default: {
      if (options.strict) {
        throw new ScheduleDataSetParseError(
          `Unknown record type: "${recordTypeChar}"`,
          { lineNumber, line, recordType: recordTypeChar },
        )
      }
      return {
        type: RecordType.Unknown,
        raw: line,
        lineNumber,
        recordTypeChar,
      }
    }
  }
}

/**
 * Parse an entire IATA SSIM Chapter 7 Schedule Data Set (`.ssim` file)
 * passed as a string into a typed structure.
 *
 * Reading the file from disk or network is the caller's responsibility, so
 * the library stays platform-agnostic (Node, browser, Workers, Deno).
 *
 * Lines may be terminated with `\n` or `\r\n`. A leading UTF-8 BOM is stripped.
 */
export function parseScheduleDataSet(
  text: string,
  options: ParseOptions = {},
): ScheduleDataSet {
  const warnings: ScheduleDataSetWarning[] = []
  const records: ScheduleDataSetRecord[] = []

  let header: HeaderRecord | null = null
  const carriers: CarrierBlock[] = []
  let currentCarrier: CarrierRecord | null = null
  let currentLegs: FlightLegRecord[] = []
  let currentSegments: SegmentDataRecord[] = []

  const normalized = stripBom(text)
  const lines = normalized.split(/\r?\n/)
  const totalLines = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length

  const pushWarning = (warning: ScheduleDataSetWarning): void => {
    warnings.push(warning)
    options.onWarning?.(warning)
  }

  for (let i = 0; i < totalLines; i++) {
    const rawLine = lines[i]!
    if (rawLine.length === 0)
      continue

    const lineNumber = i + 1
    const record = parseScheduleDataSetLine(rawLine, lineNumber, options)
    records.push(record)

    switch (record.type) {
      case RecordType.Header:
        if (header) {
          pushWarning({
            message: 'Multiple Type 1 (header) records — keeping the first',
            lineNumber,
            line: rawLine,
          })
        }
        else {
          header = record
        }
        break

      case RecordType.Carrier:
        if (currentCarrier) {
          carriers.push({
            carrier: currentCarrier,
            flightLegs: currentLegs,
            segmentData: currentSegments,
            trailer: null,
          })
          pushWarning({
            message: 'New Type 2 (carrier) before Type 5 (trailer); auto-closing previous carrier block',
            lineNumber,
            line: rawLine,
          })
        }
        currentCarrier = record
        currentLegs = []
        currentSegments = []
        break

      case RecordType.FlightLeg:
        if (!currentCarrier) {
          pushWarning({
            message: 'Type 3 (flight leg) seen before any Type 2 (carrier)',
            lineNumber,
            line: rawLine,
          })
        }
        currentLegs.push(record)
        break

      case RecordType.SegmentData:
        if (!currentCarrier) {
          pushWarning({
            message: 'Type 4 (segment data) seen before any Type 2 (carrier)',
            lineNumber,
            line: rawLine,
          })
        }
        currentSegments.push(record)
        break

      case RecordType.Trailer:
        if (!currentCarrier) {
          pushWarning({
            message: 'Type 5 (trailer) without preceding Type 2 (carrier)',
            lineNumber,
            line: rawLine,
          })
        }
        else {
          carriers.push({
            carrier: currentCarrier,
            flightLegs: currentLegs,
            segmentData: currentSegments,
            trailer: record,
          })
          currentCarrier = null
          currentLegs = []
          currentSegments = []
        }
        break

      case RecordType.Zero:
        // intentionally ignored in the hierarchical view
        break

      case RecordType.Unknown:
        pushWarning({
          message: `Unknown record type "${record.recordTypeChar}"`,
          lineNumber,
          line: rawLine,
        })
        break
    }
  }

  if (currentCarrier) {
    carriers.push({
      carrier: currentCarrier,
      flightLegs: currentLegs,
      segmentData: currentSegments,
      trailer: null,
    })
    pushWarning({
      message: 'EOF reached with an open carrier block (no Type 5 trailer)',
      lineNumber: totalLines,
      line: '',
    })
  }

  const result: ScheduleDataSet = { header, carriers, records, warnings }

  // Spec validation per § 7.5.1–7.5.5
  const rawByLine = new Map<number, string>()
  for (const r of records)
    rawByLine.set(r.lineNumber, r.raw)
  const issues = validateScheduleDataSet(result)
  for (const issue of issues) {
    const line = rawByLine.get(issue.lineNumber) ?? ''
    const msg = `${issue.rule} — ${issue.message}`
    if (options.strict) {
      throw new ScheduleDataSetParseError(msg, {
        lineNumber: issue.lineNumber,
        line,
        recordType: issue.recordType,
        field: issue.field,
      })
    }
    pushWarning({
      message: msg,
      lineNumber: issue.lineNumber,
      line,
      rule: issue.rule,
      recordType: issue.recordType,
      field: issue.field,
      column: issue.column,
      endColumn: issue.endColumn,
    })
  }

  return result
}

/**
 * Async iterator over Schedule Data Set records. Useful for streaming
 * very large files one record at a time.
 *
 * ```ts
 * for await (const record of parseScheduleDataSetRecords(text)) { ... }
 * ```
 */
export async function* parseScheduleDataSetRecords(
  text: string,
  options: ParseOptions = {},
): AsyncGenerator<ScheduleDataSetRecord> {
  const lines = stripBom(text).split(/\r?\n/)
  const totalLines = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length
  for (let i = 0; i < totalLines; i++) {
    const rawLine = lines[i]!
    if (rawLine.length === 0)
      continue
    yield parseScheduleDataSetLine(rawLine, i + 1, options)
  }
}
