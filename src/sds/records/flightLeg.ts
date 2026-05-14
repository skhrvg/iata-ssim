import type { FlightLegRecord } from '../types.ts'
import { parseJointOperationAirlines } from '../../utils/codeshare.ts'
import { parseIataDate } from '../../utils/date.ts'
import { parseDaysOfOperation } from '../../utils/days.ts'
import { sliceField, sliceTrim } from '../../utils/slice.ts'
import { parseIataTime, parseUtcOffsetMinutes } from '../../utils/time.ts'
import { RecordType } from '../types.ts'

export function parseFlightLegRecord(line: string, lineNumber: number): FlightLegRecord {
  const daysRaw = sliceField(line, 29, 35)

  return {
    type: RecordType.FlightLeg,
    raw: line,
    lineNumber,
    operationalSuffix: sliceField(line, 2, 2),
    airlineDesignator: sliceTrim(line, 3, 5),
    flightNumber: sliceTrim(line, 6, 9),
    itineraryVariationId: sliceTrim(line, 10, 11),
    legSequenceNumber: sliceTrim(line, 12, 13),
    serviceType: sliceField(line, 14, 14),
    periodFrom: parseIataDate(sliceField(line, 15, 21)),
    periodTo: parseIataDate(sliceField(line, 22, 28)),
    daysOfOperation: parseDaysOfOperation(daysRaw),
    daysOfOperationRaw: daysRaw,
    frequencyRate: sliceTrim(line, 36, 36),
    departure: {
      station: sliceTrim(line, 37, 39),
      stdPassenger: parseIataTime(sliceField(line, 40, 43)),
      stdAircraft: parseIataTime(sliceField(line, 44, 47)),
      utcOffsetMinutes: parseUtcOffsetMinutes(sliceField(line, 48, 52)),
      terminal: sliceTrim(line, 53, 54),
    },
    arrival: {
      station: sliceTrim(line, 55, 57),
      staAircraft: parseIataTime(sliceField(line, 58, 61)),
      staPassenger: parseIataTime(sliceField(line, 62, 65)),
      utcOffsetMinutes: parseUtcOffsetMinutes(sliceField(line, 66, 70)),
      terminal: sliceTrim(line, 71, 72),
    },
    aircraftType: sliceTrim(line, 73, 75),
    prbd: sliceTrim(line, 76, 95),
    prbm: sliceTrim(line, 96, 100),
    mealServiceNote: sliceTrim(line, 101, 110),
    jointOperationAirlines: parseJointOperationAirlines(sliceField(line, 111, 119)),
    mctDeparture: sliceField(line, 120, 120),
    mctArrival: sliceField(line, 121, 121),
    secureFlightIndicator: sliceField(line, 122, 122),
    itineraryVariationOverflow: sliceField(line, 128, 128),
    aircraftOwner: sliceTrim(line, 129, 131),
    cockpitCrewEmployer: sliceTrim(line, 132, 134),
    cabinCrewEmployer: sliceTrim(line, 135, 137),
    onwardAirline: sliceTrim(line, 138, 140),
    onwardFlightNumber: sliceTrim(line, 141, 144),
    aircraftRotationLayover: sliceField(line, 145, 145),
    onwardOperationalSuffix: sliceField(line, 146, 146),
    flightTransitLayover: sliceField(line, 148, 148),
    codeShareWetLease: sliceField(line, 149, 149),
    trafficRestrictionCode: sliceTrim(line, 150, 160),
    trcOverflow: sliceField(line, 161, 161),
    aircraftConfiguration: sliceTrim(line, 173, 192),
    dateVariation: sliceTrim(line, 193, 194),
    serialNumber: Number.parseInt(sliceTrim(line, 195, 200), 10) || 0,
  }
}
