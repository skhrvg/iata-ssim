import { describe, expect, it } from 'vitest'
import { isZeroFillerLine, parseZeroFiller } from '../../src/sds/records/zeroFiller.ts'
import { RecordType } from '../../src/sds/types.ts'

describe('zero filler', () => {
  it('detects all-zero line', () => {
    expect(isZeroFillerLine('0'.repeat(200))).toBe(true)
    expect(isZeroFillerLine('0'.repeat(50))).toBe(true)
  })

  it('rejects non-zero content', () => {
    expect(isZeroFillerLine(`1 ${'0'.repeat(198)}`)).toBe(false)
    expect(isZeroFillerLine('')).toBe(false)
    expect(isZeroFillerLine('000 000')).toBe(false)
  })

  it('parses zero filler', () => {
    const line = '0'.repeat(200)
    const result = parseZeroFiller(line, 2)
    expect(result.type).toBe(RecordType.Zero)
    expect(result.lineNumber).toBe(2)
    expect(result.raw).toBe(line)
  })
})
