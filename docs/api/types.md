# Types

All Chapter 7 types live in [`iata-ssim/sds`](#) and are also re-exported from the package root.

## `ScheduleDataSet`

```ts
interface ScheduleDataSet {
  header: HeaderRecord | null
  carriers: CarrierBlock[]
  records: ScheduleDataSetRecord[]
  warnings: ScheduleDataSetWarning[]
}
```

## `CarrierBlock`

```ts
interface CarrierBlock {
  carrier: CarrierRecord
  flightLegs: FlightLegRecord[]
  segmentData: SegmentDataRecord[]
  trailer: TrailerRecord | null
}
```

## `ScheduleDataSetRecord`

A discriminated union over record types. The first five members correspond to IATA SSIM § 7.5.1–7.5.5; the last two are library-side markers for lines that are not part of the spec data stream:

```ts
type ScheduleDataSetRecord
  = | HeaderRecord        // type: '1' — § 7.5.1
    | CarrierRecord       // type: '2' — § 7.5.2
    | FlightLegRecord     // type: '3' — § 7.5.3
    | SegmentDataRecord   // type: '4' — § 7.5.4
    | TrailerRecord       // type: '5' — § 7.5.5
    | ZeroFiller          // type: '0' — de-facto, all-zero filler lines
    | UnknownRecord       // type: '?' — library-specific, unrecognized first character
```

Every record extends `BaseRecord`:

```ts
interface BaseRecord {
  type: RecordType
  raw: string         // original 200-byte line
  lineNumber: number  // 1-indexed line in the source
}
```

## `FlightLegRecord`

```ts
interface FlightLegRecord extends BaseRecord {
  type: '3'
  operationalSuffix: string
  airlineDesignator: string
  flightNumber: string
  itineraryVariationId: string
  legSequenceNumber: string
  serviceType: string
  periodFrom: Date | null
  periodTo: Date | null
  daysOfOperation: number[]      // [1..7], ISO (1=Mon, 7=Sun)
  daysOfOperationRaw: string
  frequencyRate: string

  departure: {
    station: string
    stdPassenger: { h: number, m: number } | null
    stdAircraft: { h: number, m: number } | null
    utcOffsetMinutes: number | null
    terminal: string
  }
  arrival: {
    station: string
    staAircraft: { h: number, m: number } | null
    staPassenger: { h: number, m: number } | null
    utcOffsetMinutes: number | null
    terminal: string
  }

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
```

## `ParseOptions`

```ts
interface ParseOptions {
  strict?: boolean
  onWarning?: (warning: ScheduleDataSetWarning) => void
}
```

## `ScheduleDataSetWarning`

```ts
interface ScheduleDataSetWarning {
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
```

## `ScheduleDataSetParseError`

Thrown only in strict mode. Extends `Error` with:

```ts
class ScheduleDataSetParseError extends Error {
  readonly lineNumber: number | undefined
  readonly line: string | undefined
  readonly recordType: string | undefined
  readonly field: string | undefined
}
```

## `IataTime`

Plain `{ h, m }` shape used by carrier creation time and all leg STD/STA fields:

```ts
interface IataTime {
  h: number
  m: number
}
```
