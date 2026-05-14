import type { CarrierRecord } from '../types.ts'
import { parseIataDate } from '../../utils/date.ts'
import { sliceField, sliceTrim } from '../../utils/slice.ts'
import { parseIataTime } from '../../utils/time.ts'
import { RecordType } from '../types.ts'

export function parseCarrierRecord(line: string, lineNumber: number): CarrierRecord {
  return {
    type: RecordType.Carrier,
    raw: line,
    lineNumber,
    timeMode: sliceField(line, 2, 2),
    airlineDesignator: sliceTrim(line, 3, 5),
    season: sliceTrim(line, 11, 13),
    validFrom: parseIataDate(sliceField(line, 15, 21)),
    validTo: parseIataDate(sliceField(line, 22, 28)),
    creationDate: parseIataDate(sliceField(line, 29, 35)),
    titleOfData: sliceTrim(line, 36, 64),
    releaseDate: parseIataDate(sliceField(line, 65, 71)),
    scheduleStatus: sliceField(line, 72, 72),
    creatorReference: sliceTrim(line, 73, 107),
    duplicateAirlineDesignatorMarker: sliceField(line, 108, 108),
    generalInformation: sliceTrim(line, 109, 168),
    secureFlightIndicator: sliceField(line, 169, 169),
    inFlightServiceInformation: sliceTrim(line, 170, 188),
    electronicTicketingInformation: sliceTrim(line, 189, 190),
    creationTime: parseIataTime(sliceField(line, 191, 194)),
    serialNumber: Number.parseInt(sliceTrim(line, 195, 200), 10) || 0,
  }
}
