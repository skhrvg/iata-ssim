# Validation

Every call to `parseScheduleDataSet` runs the full spec validator against the parsed result. The validator implements the rules from **IATA SSIM, Chapter 7, §§ 7.5.1–7.5.5 (March 2012 edition)** — that is the authoritative reference this library is built against.

::: tip Newer editions
If you have access to a more recent edition of SSIM, please [open an issue](https://github.com/skhrvg/iata-ssim/issues) — newer editions may add DEI codes or revise byte assignments and we want to fold those in. The library is validated against the **March 2011** and **March 2012** editions today; the only material delta between them is the Secure Flight Indicator at byte 169 of the Carrier record (effective 1 Oct 2012).
:::

## What gets checked

The validator covers field-level **Status** (`M` Mandatory / `C` Conditional / `O` Optional), value formats, and cross-record consistency. Highlights:

- **§ 7.5.1 Header** — canonical Title of Contents, `recordSerialNumber === 1`.
- **§ 7.5.2 Carrier** — Time Mode (`U`/`L`), IATA airline code format, mandatory date parsing, `validFrom ≤ validTo`, Schedule Status (`P`/`C`), Secure Flight Indicator (`S`/`X`/blank, eff. 1 Oct 2012), Electronic Ticketing (`EN`/`ET`/blank).
- **§ 7.5.3 Flight Leg** — IATA airline + 4-digit flight number, IVI / leg sequence 01–99, period validity, **at least one Day of Operation**, 3-letter station codes, all four times parse, both UTC offsets, **PRBD or Aircraft Configuration mandatory**.
- **§ 7.5.4 Segment Data** — identification fields, single-alpha board/off-point indicators, 3-digit DEI, 3-letter board/off points.
- **§ 7.5.5 Trailer** — Continuation/End Code (`C`/`E`), `serialNumberCheckReference === recordSerialNumber − 1`.
- **Cross-record** — every Type 3/4/5 record's airline designator must match the opening Type 2 Carrier Record.

See [SDS → Error Handling](/sds/error-handling) for the complete rule catalogue.

## Two modes

### Lenient (default)

Issues are collected as `ScheduleDataSetWarning` entries on the returned object:

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'

const dataSet = parseScheduleDataSet(text)

for (const w of dataSet.warnings) {
  console.warn(`${w.rule} — line ${w.lineNumber}:${w.column}: ${w.message}`)
  // [§ 7.5.2 Time Mode] line 2:2: Time Mode must be "U" (UTC) or "L" (Local), got "A".
}
```

Each warning carries the **byte-precise** location: `lineNumber`, `column`, `endColumn`. IDE / terminal integrations turn `file:line:col` into clickable links.

### Strict

The first issue throws `ScheduleDataSetParseError`:

```ts
import { parseScheduleDataSet, ScheduleDataSetParseError } from 'iata-ssim/sds'

try {
  parseScheduleDataSet(text, { strict: true })
}
catch (err) {
  if (err instanceof ScheduleDataSetParseError) {
    console.error(`${err.recordType}/${err.field} @ ${err.lineNumber}: ${err.message}`)
  }
}
```

## Real-world tested

The library is validated against **14 real SSIM files from 10 different public sources**, totalling **≈ 48 500 flight legs** — including a **36 468-leg American Airlines 2015 production schedule**. Across all clean files there are zero false positives; every issue surfaced on non-clean files is a real spec deviation (mostly cross-record airline mismatches and missing-mandatory-field violations).

See `samples-validator/` in the repository for the bulk validation script. Run `pnpm samples:validate` for a compact summary or `pnpm samples:validate:verbose` for ESLint-style per-issue output with caret markers.

## Try it yourself

The [Playground](/playground) runs the parser and validator entirely in your browser — drop a `.ssim` file or paste contents and inspect issues in the Warnings tab. Click any warning row to highlight the offending bytes in the source.
