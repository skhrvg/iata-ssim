const MONTHS: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
}

/**
 * Parse an IATA SSIM date in `DDMMMYY` format (e.g. `31MAR26`) into a UTC
 * midnight `Date`. Returns `null` for empty/blank/invalid strings.
 *
 * The format is defined in SSIM Chapter 2 (Data Elements) and is shared by
 * Chapter 4 (SSM), Chapter 5 (ASM), Chapter 6 (SCR) and Chapter 7 (SDS).
 *
 * Year window: `00–69` → `2000–2069`, `70–99` → `1970–1999` (IATA convention).
 */
export function parseIataDate(value: string): Date | null {
  const v = value.trim()
  if (v.length !== 7)
    return null

  const day = Number.parseInt(v.slice(0, 2), 10)
  const mon = MONTHS[v.slice(2, 5).toUpperCase()]
  const yy = Number.parseInt(v.slice(5, 7), 10)

  if (!Number.isFinite(day) || mon === undefined || !Number.isFinite(yy))
    return null

  const year = yy >= 70 ? 1900 + yy : 2000 + yy
  return new Date(Date.UTC(year, mon, day))
}
