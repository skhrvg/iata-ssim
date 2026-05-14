export interface IataTime {
  h: number
  m: number
}

/**
 * Parse an IATA SSIM time field in `HHMM` format (e.g. `0415` → `{h:4, m:15}`).
 * SSIM permits `2400` as end-of-day. Blank/invalid input returns `null`.
 */
export function parseIataTime(value: string): IataTime | null {
  const v = value.trim()
  if (v.length !== 4)
    return null
  const h = Number.parseInt(v.slice(0, 2), 10)
  const m = Number.parseInt(v.slice(2, 4), 10)
  if (!Number.isFinite(h) || !Number.isFinite(m))
    return null
  if (h < 0 || h > 24 || m < 0 || m > 59)
    return null
  return { h, m }
}

const OFFSET_RE = /^([+-])(\d{2})(\d{2})$/

/**
 * Parse a UTC variation field (`+0300`, `-0500`) into offset minutes east of UTC.
 * The format is defined in SSIM Appendix F. Blank/invalid input returns `null`.
 */
export function parseUtcOffsetMinutes(value: string): number | null {
  const v = value.trim()
  const m = OFFSET_RE.exec(v)
  if (!m)
    return null
  const total = Number.parseInt(m[2]!, 10) * 60 + Number.parseInt(m[3]!, 10)
  return m[1] === '-' ? -total : total
}
