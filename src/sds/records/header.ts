import type { HeaderRecord } from '../types.ts'
import { sliceField, sliceTrim } from '../../utils/slice.ts'
import { RecordType } from '../types.ts'

export function parseHeaderRecord(line: string, lineNumber: number): HeaderRecord {
  return {
    type: RecordType.Header,
    raw: line,
    lineNumber,
    title: sliceTrim(line, 2, 35),
    numberOfSeasons: sliceTrim(line, 41, 41),
    dataSetSerialNumber: sliceField(line, 192, 194),
    recordSerialNumber: Number.parseInt(sliceTrim(line, 195, 200), 10) || 0,
  }
}
