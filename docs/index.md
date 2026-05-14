---
layout: home

hero:
  name: iata-ssim
  text: Parsers for IATA SSIM data formats
  tagline: Zero-dependency, type-safe TypeScript parsers.
  actions:
    - theme: brand
      text: Get Started
      link: /overview/getting-started
    - theme: alt
      text: Schedule Data Set
      link: /sds/
    - theme: alt
      text: Playground
      link: /playground
    - theme: alt
      text: Roadmap
      link: /overview/roadmap

features:
  - icon: ✈️
    title: Schedule Data Set
    details: Full IATA SSIM § 7.5 coverage — Header, Carrier, Flight Leg, Segment Data, Trailer records.
  - icon: 🌐
    title: Universal
    details: Pure-string API. No Node-only built-ins — runs in browsers, edge functions, Workers, Deno.
  - icon: 🧩
    title: Typed and raw
    details: Get decoded values (Date, time, day arrays, UTC offsets) alongside the original 200-byte raw lines for verification.
  - icon: 🗺️
    title: SSM / ASM / SCR coming soon
    details: Parsers for Chapters 4–6 (telex-style schedule messages) are planned as sister modules — shared data-element utilities are already in place. See the Roadmap for status.
---

## Quick example

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'

const dataSet = parseScheduleDataSet(text)

console.log(dataSet.carriers[0].carrier.airlineDesignator)
// → "XX" (2-letter IATA carrier code)

console.log(dataSet.carriers[0].flightLegs.length)
// → 2451

const leg = dataSet.carriers[0].flightLegs[0]
console.log(`${leg.airlineDesignator}${leg.flightNumber} ${leg.departure.station}→${leg.arrival.station}`)
// → "XX0100 AAA→BBB"
console.log(leg.daysOfOperation)
// → [1, 2, 3, 4, 5]
```

## Terminology

SSIM covers nine chapters. **"SSIM file"** is industry shorthand for **Chapter 7 — Schedule Data Set (SDS)**, the only format this library currently parses. Other chapters describe distinct telex-style messages (SSM, ASM, SCR) — see [What is SDS?](/sds/) for the full picture and the [Roadmap](/overview/roadmap) for upcoming support.
