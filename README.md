# iata-ssim

[![npm version](https://img.shields.io/npm/v/iata-ssim.svg)](https://www.npmjs.com/package/iata-ssim)
[![Code Style](https://camo.githubusercontent.com/2876effb8d27be852df5dec1d0cae04bb0827756845d199a816c49a273a42622/68747470733a2f2f616e7466752e6d652f62616467652d636f64652d7374796c652e737667)](https://github.com/antfu/eslint-config)

TypeScript parsers for the IATA [Standard Schedules Information Manual](https://www.iata.org/en/publications/manuals/standard-schedules-information/) (SSIM) data formats.

> [!IMPORTANT]
> **📘 Validated against the IATA SSIM, March 2012 edition.**
> Newer editions almost certainly add new DEI codes and may revise byte assignments. If you have access to a more recent edition of the manual — even a screenshot of the relevant chapter — please open an issue.
>
> **🤖 This package is largely AI-generated.** The architecture, API surface, validators and documentation were authored through AI agents with human review. Review carefully before production use; the test suite passes 76/76 and the parser is validated against 14 real-world `.ssim` files (~48 500 flight legs across 10 vendors) — but bugs may still exist.

## Scope

SSIM is divided into nine chapters and defines several distinct data formats. This library currently implements **Chapter 7 — Schedule Data Set** (a.k.a. SDS, the `.ssim` file format). Other chapters — SSM (Chapter 4), ASM (Chapter 5), SCR (Chapter 6) — are **coming soon** as separate sub-modules (see [Roadmap](#roadmap)).

## Status

| Chapter | Format | Module | Status |
|---------|--------|--------|--------|
| 7 | Schedule Data Set (SDS, `.ssim`) | `iata-ssim/sds` | ✅ implemented (validated against March 2011 and March 2012 editions) |
| 4 | SSM — Standard Schedules Message | `iata-ssim/ssm` *(planned)* | 🟡 coming soon |
| 5 | ASM — Ad Hoc Schedules Message | `iata-ssim/asm` *(planned)* | 🟡 coming soon |
| 6 | SCR — Slot Clearance Request | `iata-ssim/scr` *(planned)* | 🟡 coming soon |

## Install

```sh
pnpm add iata-ssim
```

Zero dependencies. ESM-only. Works in Node, browsers, edge runtimes, Workers, Deno.

## Usage — Chapter 7 (Schedule Data Set)

```ts
import { readFile } from 'node:fs/promises'
import { parseScheduleDataSet } from 'iata-ssim/sds'

const text = await readFile('schedule.ssim', 'utf-8')
const dataSet = parseScheduleDataSet(text)

const block = dataSet.carriers[0]!
console.log(`${block.carrier.airlineDesignator} — ${block.flightLegs.length} legs`)

const leg = block.flightLegs[0]!
console.log(`${leg.airlineDesignator}${leg.flightNumber} ${leg.departure.station}→${leg.arrival.station}`)
console.log('days:', leg.daysOfOperation)
console.log('valid:', leg.periodFrom, '→', leg.periodTo)
```

## Documentation

Full guide, API reference, field reference per spec section, and an in-browser playground: [iata-ssim.skhr.vg](https://iata-ssim.skhr.vg/) (or `pnpm docs:dev` for local).

## Roadmap

The other SSIM chapters describe **telex-style messages** rather than files. They share the same data-element vocabulary (Chapter 2) but use a completely different line-based format. Sister sub-modules are planned:

- `iata-ssim/ssm` — Chapter 4 (Standard Schedules Message)
- `iata-ssim/asm` — Chapter 5 (Ad Hoc Schedules Message)
- `iata-ssim/scr` — Chapter 6 (Slot Clearance Request)

The current `iata-ssim/sds` module won't change. Shared data-element utilities (`parseIataDate`, `parseIataTime`, `parseUtcOffsetMinutes`, …) already live at the package root and will be reused across formats. See [docs/overview/roadmap.md](docs/overview/roadmap.md) for prioritisation and details.

## License

[MIT](LICENSE) © skhrvg
