/**
 * `iata-ssim` — TypeScript parsers for the IATA Standard Schedules
 * Information Manual (SSIM) data formats.
 *
 * SSIM covers nine chapters; this library currently implements
 * **Chapter 7** (Schedule Data Set — `.ssim` files). Future chapters
 * (Chapter 4 SSM, Chapter 5 ASM, Chapter 6 SCR) may be added as separate
 * modules — see the [roadmap](https://iata-ssim.skhr.vg/overview/roadmap) for status.
 *
 * Two entry points:
 *
 * - **`iata-ssim`** (this file) — Chapter 7 parser **plus** the shared,
 *   SSIM-wide data-element utilities (`parseIataDate`, `parseIataTime`,
 *   `parseUtcOffsetMinutes`, `parseDaysOfOperation`,
 *   `parseJointOperationAirlines`, `IataTime`). These utilities are not
 *   specific to Chapter 7 — they'll be reused by future SSM/ASM/SCR modules.
 * - **`iata-ssim/sds`** — Chapter 7 only, no shared utilities.
 *
 * ```ts
 * import { parseScheduleDataSet } from 'iata-ssim'
 * // or, narrower:
 * import { parseScheduleDataSet } from 'iata-ssim/sds'
 * ```
 */

// Re-export the SDS (Chapter 7) module at the top level for convenience.
export * from './sds/index.ts'

// Shared IATA data-element utilities (used by Chapter 7 today; reusable for
// Chapters 4–6 if they get added later).
export { parseJointOperationAirlines } from './utils/codeshare.ts'
export { parseIataDate } from './utils/date.ts'
export { parseDaysOfOperation } from './utils/days.ts'
export type { IataTime } from './utils/time.ts'
export { parseIataTime, parseUtcOffsetMinutes } from './utils/time.ts'
