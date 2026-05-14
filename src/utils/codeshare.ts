/**
 * Parse the `Joint Operation Airline Designators` 9-character field
 * (3 slots × 3 chars). Returns the list of non-empty trimmed designators.
 */
export function parseJointOperationAirlines(value: string): string[] {
  const result: string[] = []
  for (let i = 0; i < 9; i += 3) {
    const slot = value.slice(i, i + 3).trim()
    if (slot)
      result.push(slot)
  }
  return result
}
