import { describe, expect, it } from 'vitest'
import { parseJointOperationAirlines } from '../../src/utils/codeshare.ts'

describe('parseJointOperationAirlines', () => {
  it('parses three slots', () => {
    expect(parseJointOperationAirlines('AF DL KL ')).toEqual(['AF', 'DL', 'KL'])
  })

  it('parses two-letter and three-letter codes', () => {
    expect(parseJointOperationAirlines('AB CD EFG')).toEqual(['AB', 'CD', 'EFG'])
  })

  it('skips empty slots', () => {
    expect(parseJointOperationAirlines('AB       ')).toEqual(['AB'])
    expect(parseJointOperationAirlines('         ')).toEqual([])
  })
})
