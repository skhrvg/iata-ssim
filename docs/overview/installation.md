# Installation

`iata-ssim` is ESM-only, zero-dependency, and ships TypeScript declarations. Works in Node ≥ 20.19, all modern browsers, edge runtimes, Workers, and Deno.

## Via package manager

::: code-group

```sh [pnpm]
pnpm add iata-ssim
```

```sh [npm]
npm install iata-ssim
```

```sh [yarn]
yarn add iata-ssim
```

```sh [bun]
bun add iata-ssim
```

:::

Import either from the top-level entry or the explicit Chapter 7 sub-path:

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'
//                                    ^^^^^^^^^^^^^
// equivalent: from 'iata-ssim'
```

The sub-path form makes it explicit which SSIM chapter you're using and mixes cleanly with future modules (`iata-ssim/ssm`, `iata-ssim/asm`, `iata-ssim/scr` — see the [roadmap](./roadmap)).

## Via a `<script>` tag (CDN)

Because the package is pure ESM with no runtime dependencies, you can load it directly from any ESM CDN — no bundler required.

```html
<script type="module">
  import { parseScheduleDataSet } from 'https://esm.sh/iata-ssim/sds'

  const response = await fetch('/schedules/example.ssim')
  const dataSet = parseScheduleDataSet(await response.text())

  console.log(`${dataSet.carriers[0]?.flightLegs.length ?? 0} flight legs`)
</script>
```

Alternatives: `https://cdn.jsdelivr.net/npm/iata-ssim/+esm`, `https://unpkg.com/iata-ssim?module`.

## Usage patterns

### 1. Parse a whole file at once

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'

const dataSet = parseScheduleDataSet(text)
for (const block of dataSet.carriers)
  console.log(block.carrier.airlineDesignator, block.flightLegs.length)
```

### 2. Stream record by record

For very large files, parse one record at a time without building the full hierarchy in memory:

```ts
import { parseScheduleDataSetRecords } from 'iata-ssim/sds'

let legs = 0
for await (const record of parseScheduleDataSetRecords(text)) {
  if (record.type === '3')
    legs++
}
```

### 3. Single-line parsing

For tools that already have a per-line pipeline:

```ts
import { parseScheduleDataSetLine } from 'iata-ssim/sds'

const record = parseScheduleDataSetLine(line, lineNumber)
switch (record.type) {
  case '3': /* flight leg */ break
  case '4': /* segment data */ break
  // …
}
```

### 4. Strict mode — fail fast on spec violations

```ts
import { parseScheduleDataSet, ScheduleDataSetParseError } from 'iata-ssim/sds'

try {
  parseScheduleDataSet(text, { strict: true })
}
catch (err) {
  if (err instanceof ScheduleDataSetParseError)
    console.error(`line ${err.lineNumber} (${err.recordType}): ${err.message}`)
}
```

### 5. Stand-alone validator

Validate a pre-parsed structure (e.g. one you built in memory):

```ts
import { parseScheduleDataSet, validateScheduleDataSet } from 'iata-ssim/sds'

const dataSet = parseScheduleDataSet(text, { strict: false })
const issues = validateScheduleDataSet(dataSet)
for (const issue of issues)
  console.warn(`[${issue.rule}] line ${issue.lineNumber}:${issue.column}: ${issue.message}`)
```

See [Validation](./validation) for what the validator checks and [SDS → Error Handling](/sds/error-handling) for the full rule list.
