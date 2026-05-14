# Parsing SDS

`parseScheduleDataSet` is the entry point. It accepts a UTF-8 string and returns the [parsed structure](#result-shape). Reading the file is **your** responsibility — that keeps the library platform-agnostic.

Need install steps? See [Installation](/overview/installation).

## In Node

```ts
import { readFile } from 'node:fs/promises'
import { parseScheduleDataSet } from 'iata-ssim/sds'

const text = await readFile('schedule.ssim', 'utf-8')
const dataSet = parseScheduleDataSet(text)

for (const block of dataSet.carriers)
  console.log(`${block.carrier.airlineDesignator} — ${block.flightLegs.length} legs`)
```

## In the browser

The same `parseScheduleDataSet` works directly — there are no Node-only imports in the SDS module.

### From a file input

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'

const input = document.querySelector<HTMLInputElement>('input[type=file]')!
input.addEventListener('change', async () => {
  const file = input.files?.[0]
  if (!file)
    return
  const dataSet = parseScheduleDataSet(await file.text())
  console.log(`Parsed ${dataSet.carriers[0]?.flightLegs.length ?? 0} flight legs`)
})
```

### From fetch

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'

const response = await fetch('/schedules/example.ssim')
const dataSet = parseScheduleDataSet(await response.text())
```

::: tip Encoding
Pass UTF-8 text. A leading UTF-8 BOM is stripped transparently. Both `\n` and `\r\n` line endings are accepted. The parser is byte-for-byte deterministic — the same input always yields the same record stream.
:::

## Result shape

```ts
interface ScheduleDataSet {
  header: HeaderRecord | null
  carriers: CarrierBlock[]
  records: ScheduleDataSetRecord[]   // flat stream, including filler / unknown
  warnings: ScheduleDataSetWarning[]
}

interface CarrierBlock {
  carrier: CarrierRecord
  flightLegs: FlightLegRecord[]
  segmentData: SegmentDataRecord[]
  trailer: TrailerRecord | null
}
```

Each parsed record exposes both decoded fields (dates as `Date`, time as `{ h, m }`, days as `number[]`, UTC offsets in minutes) and the original 200-character `raw` line for verification:

```ts
const leg = dataSet.carriers[0]!.flightLegs[0]!

leg.airlineDesignator          // "XX" — 2-letter IATA carrier code
leg.flightNumber               // "0100" — 4-digit, zero-padded
leg.periodFrom                 // Date — UTC midnight
leg.daysOfOperation            // [1, 2, 3, 4, 5] — ISO weekdays, 1=Mon
leg.departure.station          // "AAA" — 3-letter IATA airport code
leg.departure.stdPassenger     // { h: 8, m: 0 }
leg.departure.utcOffsetMinutes // 0
leg.arrival.station            // "BBB"
leg.aircraftType               // "32A" — IATA aircraft type code
leg.raw                        // the original 200-byte line
```

## Line-by-line API

For tools that already have a per-line pipeline, parse one line at a time:

```ts
import { parseScheduleDataSetLine } from 'iata-ssim/sds'

const record = parseScheduleDataSetLine(line, lineNumber)
switch (record.type) {
  case '1': /* HeaderRecord */ break
  case '2': /* CarrierRecord */ break
  case '3': /* FlightLegRecord */ break
  case '4': /* SegmentDataRecord */ break
  case '5': /* TrailerRecord */ break
  case '0': /* ZeroFiller */ break
  case '?': /* UnknownRecord */ break
}
```

## Async iterator — streaming large files

For multi-megabyte schedules where you don't need the full hierarchy in memory:

```ts
import { parseScheduleDataSetRecords } from 'iata-ssim/sds'

let legs = 0
for await (const record of parseScheduleDataSetRecords(text)) {
  if (record.type === '3')
    legs++
}
```

The iterator yields records as it walks the input, in source order.

## Strict vs lenient mode

By default the parser is lenient: malformed lines become warnings on `dataSet.warnings`. Strict mode throws `ScheduleDataSetParseError` on the first issue:

```ts
import { parseScheduleDataSet, ScheduleDataSetParseError } from 'iata-ssim/sds'

try {
  parseScheduleDataSet(text, { strict: true })
}
catch (err) {
  if (err instanceof ScheduleDataSetParseError)
    console.error(`line ${err.lineNumber}: ${err.message}`)
}
```

See [Error Handling](./error-handling) for the full validation behaviour and rule catalogue.
