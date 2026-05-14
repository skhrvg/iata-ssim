# Error Handling

The parser supports two modes: **lenient** (default) and **strict**.

## Lenient mode

By default, malformed or unrecognized lines do **not** throw. Instead, they are collected as `ScheduleDataSetWarning` entries in `dataSet.warnings`. Unknown record types become records with `type === '?'` so you can still see them in the flat stream.

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'

const dataSet = parseScheduleDataSet(text)
for (const warning of dataSet.warnings) {
  console.warn(`Line ${warning.lineNumber}: ${warning.message}`)
}
```

You can also be notified eagerly via the `onWarning` callback:

```ts
parseScheduleDataSet(text, {
  onWarning: w => console.warn(`SSIM: ${w.message} (line ${w.lineNumber})`),
})
```

## Strict mode

Strict mode throws `ScheduleDataSetParseError` as soon as something unexpected is encountered (unknown record type, malformed line, etc.).

```ts
import { parseScheduleDataSet, ScheduleDataSetParseError } from 'iata-ssim/sds'

try {
  parseScheduleDataSet(text, { strict: true })
}
catch (err) {
  if (err instanceof ScheduleDataSetParseError) {
    console.error(`line ${err.lineNumber} (${err.recordType}): ${err.message}`)
  }
}
```

`ScheduleDataSetParseError` exposes:

- `message` — human-readable problem description
- `lineNumber` — 1-indexed line in the original input
- `line` — the offending source line
- `recordType` — the record-type character that was being processed
- `field` — the field name (when the error is field-specific)
- `cause` — the underlying error, if any

## Spec validation

After parsing, `parseScheduleDataSet` runs the full validator from `iata-ssim/sds/validation` against the IATA SSIM, March 2012 edition (§§ 7.5.1–7.5.5). Each violation becomes a `ValidationIssue`:

```ts
interface ValidationIssue {
  rule: string         // e.g. "§ 7.5.2 Time Mode"
  message: string
  lineNumber: number
  recordType: string   // "1"–"5"
  field?: string       // property name on the parsed record
}
```

In **lenient mode** each issue is added to `dataSet.warnings`; in **strict mode** the first issue is thrown as `ScheduleDataSetParseError`. The error's `recordType` and `field` properties point at the offending field.

### What gets checked

Highlights — see [`validation.ts`](https://github.com/skhrvg/iata-ssim/blob/main/src/sds/validation.ts) for the full list:

- **§ 7.5.1 Header** — canonical Title of Contents, `recordSerialNumber === 1`.
- **§ 7.5.2 Carrier** — Time Mode (`U`/`L`), IATA airline code format, mandatory dates parse as DDMMMYY, `validFrom ≤ validTo`, Schedule Status (`P`/`C`), Secure Flight Indicator (`S`/`X`/blank, eff. 1 Oct 2012), Electronic Ticketing (`EN`/`ET`/blank), Creation Time.
- **§ 7.5.3 Flight Leg** — IATA airline + 4-digit flight number, IVI / leg sequence 01–99, service type 1A, period validity, **at least one Day of Operation**, 3-letter station codes, all four times parse, both UTC offsets, 3-character aircraft type, **PRBD OR Aircraft Configuration** mandatory (spec note: "Either this field or…"), Secure Flight Indicator.
- **§ 7.5.4 Segment Data** — same identification fields as Flight Leg, single-alpha board/off-point indicators, 3-digit DEI (right-justified, zero-filled), 3-letter board/off points.
- **§ 7.5.5 Trailer** — IATA airline, Continuation/End Code (`C`/`E`), `serialNumberCheckReference === recordSerialNumber − 1`.
- **Cross-record** — every Type 3/4/5 record's airline designator must match the opening Type 2 Carrier Record.

### Stand-alone validator

If you have a pre-parsed `ScheduleDataSet`, run validation explicitly:

```ts
import { parseScheduleDataSet, validateScheduleDataSet } from 'iata-ssim/sds'

const dataSet = parseScheduleDataSet(text, { strict: false })
const issues = validateScheduleDataSet(dataSet)
for (const issue of issues)
  console.warn(`[${issue.rule}] line ${issue.lineNumber}: ${issue.message}`)
```

Per-record validators are also exposed (`validateHeaderRecord`, `validateCarrierRecord`, `validateFlightLegRecord`, `validateSegmentDataRecord`, `validateTrailerRecord`) for callers that want to validate records they constructed in memory.

### Canonical header constant

```ts
import { EXPECTED_HEADER_TITLE } from 'iata-ssim/sds'
// → "AIRLINE STANDARD SCHEDULE DATA SET"
```
