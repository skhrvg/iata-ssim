# Getting Started

`iata-ssim` is a zero-dependency TypeScript parser for IATA [Standard Schedules Information Manual](https://www.iata.org/en/publications/manuals/standard-schedules-information/) (SSIM) data formats. Today it implements **Chapter 7 — Schedule Data Set** (`.ssim` files); SSM / ASM / SCR are [coming soon](./roadmap).

## 30-second example

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'

const dataSet = parseScheduleDataSet(text)

const block = dataSet.carriers[0]!
console.log(`${block.carrier.airlineDesignator} — ${block.flightLegs.length} legs`)
// → "SU — 3370 legs"

const leg = block.flightLegs[0]!
console.log(`${leg.airlineDesignator}${leg.flightNumber} ${leg.departure.station}→${leg.arrival.station}`)
// → "SU006 SVO→LED"
console.log(leg.daysOfOperation)
// → [2, 3, 4, 6, 7]   (ISO weekdays, 1=Mon)

if (dataSet.warnings.length > 0) {
  for (const w of dataSet.warnings)
    console.warn(`[${w.rule}] line ${w.lineNumber}:${w.column}: ${w.message}`)
}
```

The parser accepts any UTF-8 string (BOM is stripped automatically; `\n` and `\r\n` line endings both work). Reading the file is **your** responsibility — that keeps the library platform-agnostic.

## In Node

```ts
import { readFile } from 'node:fs/promises'
import { parseScheduleDataSet } from 'iata-ssim/sds'

const text = await readFile('schedule.ssim', 'utf-8')
const dataSet = parseScheduleDataSet(text)
```

## In the browser

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'

document.querySelector('input[type=file]')!.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file)
    return
  const dataSet = parseScheduleDataSet(await file.text())
  console.log(`${dataSet.carriers[0]?.flightLegs.length ?? 0} flight legs`)
})
```

For more — `fetch()`, streaming large files, drag-and-drop — see [Parsing SDS → In the browser](/sds/parsing#in-the-browser).

## Next steps

- [**Installation**](./installation) — pnpm/npm, CDN `<script>` tag, scoped imports
- [**Validation**](./validation) — what the spec validator checks (and how to use strict mode)
- [**SDS deep dive**](/sds/) — full record-type reference, field offsets, error handling
- [**Playground**](/playground) — drop a `.ssim` file in your browser and inspect the result
