import type { ZeroFiller } from '../types.ts'
import { RecordType } from '../types.ts'

const ZERO_RE = /^0+$/

/**
 * All-zero filler lines are a de-facto industry convention (legacy mainframe
 * block padding); they are not part of IATA SSIM § 7.5.
 */
export function isZeroFillerLine(line: string): boolean {
  return ZERO_RE.test(line)
}

export function parseZeroFiller(line: string, lineNumber: number): ZeroFiller {
  return {
    type: RecordType.Zero,
    raw: line,
    lineNumber,
  }
}
