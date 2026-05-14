/**
 * Parse an IATA SSIM `Days of Operation` 7-character field.
 *
 * Each position 1..7 corresponds to a day (1=Mon, 7=Sun, ISO).
 * The character at position `i` is either the digit `i` (active) or a space.
 *
 * Examples:
 *   `" 234 67"` → `[2, 3, 4, 6, 7]`
 *   `"1234567"` → `[1, 2, 3, 4, 5, 6, 7]`
 *   `"       "` → `[]`
 */
export function parseDaysOfOperation(value: string): number[] {
  const days: number[] = []
  for (let i = 0; i < 7 && i < value.length; i++) {
    const ch = value[i]
    if (ch && ch !== ' ' && ch !== '0') {
      const day = Number.parseInt(ch, 10)
      if (day >= 1 && day <= 7)
        days.push(day)
    }
  }
  return days
}
