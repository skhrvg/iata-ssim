import type { SegmentDataRecord } from '../types.ts'
import { sliceField, sliceTrim } from '../../utils/slice.ts'
import { RecordType } from '../types.ts'

export function parseSegmentDataRecord(line: string, lineNumber: number): SegmentDataRecord {
  return {
    type: RecordType.SegmentData,
    raw: line,
    lineNumber,
    operationalSuffix: sliceField(line, 2, 2),
    airlineDesignator: sliceTrim(line, 3, 5),
    flightNumber: sliceTrim(line, 6, 9),
    itineraryVariationId: sliceTrim(line, 10, 11),
    legSequenceNumber: sliceTrim(line, 12, 13),
    serviceType: sliceField(line, 14, 14),
    itineraryVariationOverflow: sliceField(line, 28, 28),
    boardPointIndicator: sliceField(line, 29, 29),
    offPointIndicator: sliceField(line, 30, 30),
    dataElementIdentifier: sliceTrim(line, 31, 33),
    boardPoint: sliceTrim(line, 34, 36),
    offPoint: sliceTrim(line, 37, 39),
    data: sliceField(line, 40, 194).trimEnd(),
    serialNumber: Number.parseInt(sliceTrim(line, 195, 200), 10) || 0,
  }
}
