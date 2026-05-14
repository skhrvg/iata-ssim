# Functions

## `parseScheduleDataSet(text, options?)`

Parses an entire Schedule Data Set (Chapter 7 `.ssim` file) passed as a string. Returns a [`ScheduleDataSet`](./types.md#scheduledataset).

```ts
function parseScheduleDataSet(text: string, options?: ParseOptions): ScheduleDataSet
```

- **`text`** — the full file contents. UTF-8 BOM is automatically stripped. Lines can be `\n` or `\r\n` terminated.
- **`options.strict`** — when `true`, the parser throws `ScheduleDataSetParseError` on the first malformed or unknown line. Default `false`.
- **`options.onWarning`** — callback fired for every warning (lenient mode).

```ts
const dataSet = parseScheduleDataSet(text, {
  strict: false,
  onWarning: w => console.warn(w.message),
})
```

## `parseScheduleDataSetLine(line, lineNumber?, options?)`

Parses a single 200-byte line into a typed record.

```ts
function parseScheduleDataSetLine(
  line: string,
  lineNumber?: number,
  options?: ParseOptions,
): ScheduleDataSetRecord
```

The result is discriminated by `record.type`:

```ts
const record = parseScheduleDataSetLine(line, 11)
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

## `parseScheduleDataSetRecords(text, options?)`

Async generator over records. Useful for handling large files one record at a time.

```ts
async function* parseScheduleDataSetRecords(
  text: string,
  options?: ParseOptions,
): AsyncGenerator<ScheduleDataSetRecord>
```

```ts
for await (const record of parseScheduleDataSetRecords(text)) {
  // ...
}
```

## Low-level record parsers

Each record-type parser is also exposed for advanced use:

```ts
function parseHeaderRecord(line: string, lineNumber: number): HeaderRecord
function parseCarrierRecord(line: string, lineNumber: number): CarrierRecord
function parseFlightLegRecord(line: string, lineNumber: number): FlightLegRecord
function parseSegmentDataRecord(line: string, lineNumber: number): SegmentDataRecord
function parseTrailerRecord(line: string, lineNumber: number): TrailerRecord
function parseZeroFiller(line: string, lineNumber: number): ZeroFiller
function isZeroFillerLine(line: string): boolean
```

## Validation

```ts
function validateScheduleDataSet(file: ScheduleDataSet): ValidationIssue[]
function validateHeaderRecord(r: HeaderRecord): ValidationIssue[]
function validateCarrierRecord(r: CarrierRecord): ValidationIssue[]
function validateFlightLegRecord(r: FlightLegRecord): ValidationIssue[]
function validateSegmentDataRecord(r: SegmentDataRecord): ValidationIssue[]
function validateTrailerRecord(r: TrailerRecord): ValidationIssue[]
```

`parseScheduleDataSet` already invokes `validateScheduleDataSet` internally. Call these explicitly when you need to validate records you constructed in memory or when you want to re-validate after mutation. See [Error Handling → Spec validation](/sds/error-handling#spec-validation) for the full list of rules.

```ts
interface ValidationIssue {
  rule: string         // e.g. "§ 7.5.2 Time Mode"
  message: string
  lineNumber: number
  recordType: string
  field?: string
}
```

## Shared IATA data-element utilities

These helpers parse individual SSIM Chapter 2 data elements and are the same building blocks the record parsers use. They are format-agnostic — usable today for Chapter 7 and tomorrow for SSM/ASM/SCR.

```ts
function parseIataDate(value: string): Date | null            // DDMMMYY
function parseIataTime(value: string): { h: number, m: number } | null // HHMM
function parseUtcOffsetMinutes(value: string): number | null  // ±HHMM
function parseDaysOfOperation(value: string): number[]        // 7-char days
function parseJointOperationAirlines(value: string): string[] // 9-char (3 × 3)
```
