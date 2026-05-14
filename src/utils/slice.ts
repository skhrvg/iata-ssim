/**
 * Fixed-width field helpers.
 *
 * IATA SSIM uses 1-indexed inclusive byte positions in its specification
 * (e.g. "bytes 15 to 21"). These helpers preserve that convention.
 */

export function sliceField(line: string, from: number, to: number): string {
  return line.slice(from - 1, to)
}

export function sliceTrim(line: string, from: number, to: number): string {
  return line.slice(from - 1, to).trim()
}
