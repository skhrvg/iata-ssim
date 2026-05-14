# What is SDS?

The **Schedule Data Set (SDS)** is the bulk file transfer format defined in IATA SSIM Chapter 7 (§§ 7.5.1–7.5.5). A single file contains a complete airline schedule for one or more carriers:

- A header
- One or more *carrier blocks*, each composed of a Carrier record, any number of Flight Leg records (optionally followed by Segment Data records carrying DEI codes), closed by a Trailer record

Every record is **exactly 200 bytes wide**. The first byte identifies the record type: `1` (Header), `2` (Carrier), `3` (Flight Leg), `4` (Segment Data), `5` (Trailer). All-zero filler lines are tolerated as a de-facto industry convention.

::: tip Scope
SDS is the only SSIM format implemented today. See the [Roadmap](/overview/roadmap) for SSM / ASM / SCR (coming soon).
:::

## File extensions

The IATA SSIM specification **does not define any file extension**. In practice you'll encounter:

| Extension | Notes |
|-----------|-------|
| `.ssim`   | Industry de-facto convention for Chapter 7 data sets. Most common. |
| `.sds`    | Less common but explicitly names the format. |
| `.txt`    | Plain text fallback — same content, no convention attached. |

The library does not look at the extension; pass the file contents as a string and `parseScheduleDataSet` does the rest. To detect whether a file is a Schedule Data Set, check that the first non-blank line begins with:

```
1AIRLINE STANDARD SCHEDULE DATA SET
```

This is the canonical Title of Contents per § 7.5.1 (and the validator emits a warning when the header doesn't match it).

## Record types

| Type | Name          | Purpose |
|------|---------------|---------|
| `1`  | Header        | File-format identifier (`AIRLINE STANDARD SCHEDULE DATA SET`) |
| `2`  | Carrier       | Carrier identifier, validity window, schedule generation metadata |
| `3`  | Flight Leg    | One scheduled leg — most of the data lives here |
| `4`  | Segment Data  | Per-leg / per-segment supplementary data via DEI codes |
| `5`  | Trailer       | End-of-carrier marker with a record-count check |

See [Field Reference](./field-reference) for the byte-by-byte layout of each type.

## File structure

```
1 Header
…zero filler (see below)…
2 Carrier A
3 Flight leg 1
3 Flight leg 2
4 Segment data for leg 1 (optional)
…
5 Trailer for carrier A
2 Carrier B
…
5 Trailer for carrier B
…zero filler…
```

The parser returns the data both ways:

- `dataSet.records` — flat list mirroring the source order (good for round-tripping).
- `dataSet.carriers` — hierarchical view, one entry per Type 2 block, with Type 3/4/5 records grouped underneath.

## Zero filler (de-facto, non-standard)

Real-world SSIM files routinely contain lines made entirely of `0` characters between or around the standard records. These are **not described in the IATA SSIM specification** — they are an industry convention, likely a legacy of mainframe block alignment on tape storage.

Every public SSIM parser silently skips them, and this library does the same: zero-only lines are surfaced as a separate record type so callers can still see them, but they are excluded from the `carriers[]` hierarchy.

| Type | Name        | Status |
|------|-------------|--------|
| `0`  | Zero filler | De-facto convention, not in the spec |
| `?`  | Unknown     | Library-specific marker for unrecognized first characters |

## `RecordType` constants

The `RecordType` export is both a value and a type, and includes the two non-standard markers for completeness:

```ts
import { RecordType } from 'iata-ssim/sds'

if (record.type === RecordType.FlightLeg) {
  // narrows record to FlightLegRecord
}
```

| Member          | Value | Standard? |
|-----------------|-------|-----------|
| `Header`        | `'1'` | ✓ |
| `Carrier`       | `'2'` | ✓ |
| `FlightLeg`     | `'3'` | ✓ |
| `SegmentData`   | `'4'` | ✓ |
| `Trailer`       | `'5'` | ✓ |
| `Zero`          | `'0'` | de-facto |
| `Unknown`       | `'?'` | library-specific |

## Spec editions

This library is validated against the **March 2011** and **March 2012** editions of SSIM. The only material change between them is in **Record Type 2 (Carrier)**: byte 169 was reassigned from `generalInformation` to a new `secureFlightIndicator` field, effective 1 October 2012 — both layouts are supported.

## Next

- **[Parsing SDS](./parsing)** — how to load and parse files in Node and the browser.
- **[Field reference](./field-reference)** — full byte-by-byte spec tables.
- **[Error handling](./error-handling)** — lenient vs strict modes; full list of validation rules.
- **[Playground](/playground)** — drop a `.ssim` file in your browser and inspect the parsed result.
