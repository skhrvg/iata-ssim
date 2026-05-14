import { describe, expect, it } from 'vitest'
import { parseScheduleDataSet, ScheduleDataSetParseError } from '../../src/sds/index.ts'

function buildHeader(title: string): string {
  // 1 (type) + 34 chars title + 156 chars spare + 3 chars data-set serial + 6 chars record serial = 200
  const titleField = title.padEnd(34, ' ').slice(0, 34)
  const line = `1${titleField}${' '.repeat(156)}001000001`
  if (line.length !== 200)
    throw new Error(`fixture length ${line.length}`)
  return `${line}\r\n`
}

describe('header sanity check (§ 7.5.1)', () => {
  it('passes silently for the canonical title', () => {
    const result = parseScheduleDataSet(buildHeader('AIRLINE STANDARD SCHEDULE DATA SET'))
    expect(result.warnings).toHaveLength(0)
    expect(result.header?.title).toBe('AIRLINE STANDARD SCHEDULE DATA SET')
  })

  it('emits a warning for a non-standard title (lenient mode)', () => {
    const result = parseScheduleDataSet(buildHeader('IATA  AX        20260101'))
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]!.message).toContain('§ 7.5.1 Title of Contents')
    expect(result.warnings[0]!.message).toContain('Expected title')
    expect(result.warnings[0]!.lineNumber).toBe(1)
    expect(result.header).not.toBeNull()
  })

  it('throws in strict mode', () => {
    expect(() => parseScheduleDataSet(buildHeader('SOMETHING ELSE'), { strict: true }))
      .toThrow(ScheduleDataSetParseError)
  })

  it('strict-mode error carries spec context', () => {
    try {
      parseScheduleDataSet(buildHeader('SOMETHING ELSE'), { strict: true })
      expect.fail('should have thrown')
    }
    catch (err) {
      expect(err).toBeInstanceOf(ScheduleDataSetParseError)
      const e = err as ScheduleDataSetParseError
      expect(e.recordType).toBe('1')
      expect(e.field).toBe('title')
      expect(e.lineNumber).toBe(1)
      expect(e.message).toContain('AIRLINE STANDARD SCHEDULE DATA SET')
    }
  })

  it('fires onWarning callback', () => {
    const seen: string[] = []
    parseScheduleDataSet(buildHeader('WRONG'), {
      onWarning: (w) => { seen.push(w.message) },
    })
    expect(seen).toHaveLength(1)
    expect(seen[0]).toContain('§ 7.5.1')
  })
})
