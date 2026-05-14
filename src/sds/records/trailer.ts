import type { TrailerRecord } from '../types.ts'
import { parseIataDate } from '../../utils/date.ts'
import { sliceField, sliceTrim } from '../../utils/slice.ts'
import { RecordType } from '../types.ts'

export function parseTrailerRecord(line: string, lineNumber: number): TrailerRecord {
  return {
    type: RecordType.Trailer,
    raw: line,
    lineNumber,
    airlineDesignator: sliceTrim(line, 3, 5),
    releaseDate: parseIataDate(sliceField(line, 6, 12)),
    serialNumberCheckReference: Number.parseInt(sliceTrim(line, 188, 193), 10) || 0,
    continuationEndCode: sliceField(line, 194, 194),
    recordSerialNumber: Number.parseInt(sliceTrim(line, 195, 200), 10) || 0,
  }
}
