#!/usr/bin/env node
/**
 * Bulk validator for IATA SSIM Schedule Data Set files.
 *
 * Reads every file under `samples-validator/samples/` (configurable via CLI
 * args), parses each with `parseScheduleDataSet`, runs spec validation, and
 * prints a per-file report.
 *
 * CLI:
 *   node samples-validator/validator.ts             # compact summary
 *   node samples-validator/validator.ts -v          # verbose: one block per
 *                                                   #   issue with caret marker
 *   node samples-validator/validator.ts --verbose   # alias
 *   node samples-validator/validator.ts <file...>   # validate explicit files
 *
 * Error locations are printed as `file:line:column` (1-indexed) — VS Code,
 * iTerm and most modern terminals turn these into clickable links.
 *
 * Requires the library to be built first: `pnpm build`. The
 * `pnpm samples:validate` task does this automatically.
 */

import type { ScheduleDataSetWarning } from '../dist/index.js'
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import process, { exit } from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseScheduleDataSet } from '../dist/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const DEFAULT_DIR = resolve(__dirname, 'samples')

const MAX_RULE_PREVIEW = 5
const MAX_HEADER_PREVIEW = 60

const tty = process.stdout.isTTY
const COLOR = tty
  ? {
      dim: '\x1B[2m',
      red: '\x1B[31m',
      green: '\x1B[32m',
      yellow: '\x1B[33m',
      cyan: '\x1B[36m',
      magenta: '\x1B[35m',
      bold: '\x1B[1m',
      reset: '\x1B[0m',
    }
  : { dim: '', red: '', green: '', yellow: '', cyan: '', magenta: '', bold: '', reset: '' }

interface CliOptions {
  verbose: boolean
  inputs: string[]
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { verbose: false, inputs: [] }
  for (const a of argv) {
    if (a === '-v' || a === '--verbose')
      opts.verbose = true
    else if (a === '-h' || a === '--help') {
      printHelp()
      exit(0)
    }
    else if (a.startsWith('-')) {
      console.error(`Unknown option: ${a}`)
      exit(2)
    }
    else
      opts.inputs.push(a)
  }
  return opts
}

function printHelp(): void {
  console.log(`Usage: node samples-validator/validator.ts [options] [files...]

Options:
  -v, --verbose   Show each validation issue with a caret marker pointing at
                  the offending bytes, plus the surrounding source line.
  -h, --help      Show this help.

Files default to samples-validator/samples/*.ssim.`)
}

function categorize(firstLine: string): string {
  // Strip a leading UTF-8 BOM (U+FEFF) so files saved with one still classify.
  const head = firstLine.charCodeAt(0) === 0xFEFF ? firstLine.slice(1) : firstLine
  if (head.startsWith('1AIRLINE STANDARD SCHEDULE DATA SET')) return 'Chapter 7 SDS'
  if (head.startsWith('1')) return 'Type 1 (non-canonical)'
  if (head.startsWith('SSM')) return 'Chapter 4 SSM (coming soon)'
  if (head.startsWith('ASM')) return 'Chapter 5 ASM (coming soon)'
  if (head.startsWith('SCR')) return 'Chapter 6 SCR (coming soon)'
  return 'unknown'
}

async function gatherFiles(opts: CliOptions): Promise<string[]> {
  if (opts.inputs.length > 0) {
    const expanded: string[] = []
    for (const i of opts.inputs) {
      const path = resolve(process.cwd(), i)
      const s = await stat(path).catch(() => null)
      if (!s) {
        console.error(`No such file or directory: ${i}`)
        exit(2)
      }
      if (s.isDirectory()) {
        const entries = await readdir(path)
        for (const e of entries) if (e.endsWith('.ssim')) expanded.push(resolve(path, e))
      }
      else
        expanded.push(path)
    }
    return expanded.sort()
  }
  const entries = await readdir(DEFAULT_DIR)
  return entries.filter(n => n.endsWith('.ssim')).sort().map(n => resolve(DEFAULT_DIR, n))
}

function renderCaret(line: string, column: number, endColumn: number): string {
  const trimmed = line.replace(/\r$/, '')
  const visible = trimmed.length > 0 ? trimmed : '<empty line>'
  // Caret line: spaces up to column-1, then ^ for the range.
  const pad = ' '.repeat(Math.max(0, column - 1))
  const span = '^'.repeat(Math.max(1, endColumn - column + 1))
  return `${visible}\n${pad}${COLOR.red}${span}${COLOR.reset}`
}

function pad(s: string | number, n: number): string {
  return String(s).padEnd(n, ' ')
}

function summarize(filePath: string, text: string): {
  filePath: string
  sizeKB: string
  lineCount: number
  lineLengths: number[]
  firstLine: string
  category: string
  headerTitle: string | null
  carriers: number
  legs: number
  segs: number
  warnings: ScheduleDataSetWarning[]
  issuesByRule: Map<string, number>
} {
  const sizeKB = (text.length / 1024).toFixed(1)
  const allLines = text.split(/\r?\n/).filter(Boolean)
  const firstLine = (allLines[0] ?? '').slice(0, MAX_HEADER_PREVIEW)
  const lineLengths = [...new Set(allLines.map(l => l.length))].sort((a, b) => a - b)
  const ds = parseScheduleDataSet(text)
  const issuesByRule = new Map<string, number>()
  for (const w of ds.warnings) {
    const rule = w.rule ?? w.message.split(' — ')[0] ?? w.message
    issuesByRule.set(rule, (issuesByRule.get(rule) ?? 0) + 1)
  }
  return {
    filePath,
    sizeKB,
    lineCount: allLines.length,
    lineLengths,
    firstLine,
    category: categorize(allLines[0] ?? ''),
    headerTitle: ds.header?.title ?? null,
    carriers: ds.carriers.length,
    legs: ds.carriers.reduce((acc, c) => acc + c.flightLegs.length, 0),
    segs: ds.carriers.reduce((acc, c) => acc + c.segmentData.length, 0),
    warnings: ds.warnings,
    issuesByRule,
  }
}

function clickableLocation(filePath: string, lineNumber: number, column: number | undefined): string {
  const rel = relative(PROJECT_ROOT, filePath) || filePath
  const col = column ?? 1
  return `${rel}:${lineNumber}:${col}`
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  const files = await gatherFiles(opts)
  if (files.length === 0) {
    console.error(`No .ssim files found. Drop files into ${relative(PROJECT_ROOT, DEFAULT_DIR)}/ or pass paths as arguments.`)
    exit(2)
  }

  type Report = ReturnType<typeof summarize> & { error?: undefined } | { filePath: string, error: string }
  const reports: Report[] = []
  for (const path of files) {
    const text = await readFile(path, 'utf-8')
    try {
      reports.push(summarize(path, text))
    }
    catch (err) {
      reports.push({ filePath: path, error: err instanceof Error ? err.message : String(err) })
    }
  }

  for (const r of reports) {
    const fileLabel = relative(PROJECT_ROOT, r.filePath)
    if ('error' in r) {
      console.log()
      console.log(`${COLOR.bold}${fileLabel}${COLOR.reset}`)
      console.log(`  ${COLOR.red}✗ parse error: ${r.error}${COLOR.reset}`)
      continue
    }

    console.log()
    console.log(`${COLOR.bold}${fileLabel}${COLOR.reset}`)
    console.log(`  ${COLOR.dim}size:${COLOR.reset}        ${r.sizeKB} KB · ${r.lineCount} lines · widths: [${r.lineLengths.join(', ')}]`)
    console.log(`  ${COLOR.dim}format:${COLOR.reset}      ${r.category === 'Chapter 7 SDS' ? COLOR.green : COLOR.yellow}${r.category}${COLOR.reset}`)
    console.log(`  ${COLOR.dim}first line:${COLOR.reset}  ${COLOR.dim}${r.firstLine}…${COLOR.reset}`)
    console.log(`  ${COLOR.dim}parsed:${COLOR.reset}      ${r.carriers} carrier(s), ${r.legs} flight leg(s), ${r.segs} segment record(s)`)

    if (r.warnings.length === 0) {
      console.log(`  ${COLOR.dim}validation:${COLOR.reset}  ${COLOR.green}✓ no issues${COLOR.reset}`)
      continue
    }

    console.log(`  ${COLOR.dim}validation:${COLOR.reset}  ${COLOR.red}✗ ${r.warnings.length} issue(s)${COLOR.reset}`)

    if (opts.verbose) {
      for (const w of r.warnings) {
        const loc = clickableLocation(r.filePath, w.lineNumber, w.column)
        const colRange = w.column !== undefined && w.endColumn !== undefined
          ? `${w.column}-${w.endColumn}`
          : '?'
        console.log()
        console.log(`  ${COLOR.cyan}${loc}${COLOR.reset} ${COLOR.dim}(bytes ${colRange})${COLOR.reset}`)
        if (w.rule)
          console.log(`    ${COLOR.bold}${w.rule}${COLOR.reset}`)
        const msg = w.rule ? w.message.replace(`${w.rule} — `, '') : w.message
        console.log(`    ${msg}`)
        if (w.line && w.column !== undefined && w.endColumn !== undefined) {
          const lineLabel = `    ${COLOR.dim}${String(w.lineNumber).padStart(5)} │${COLOR.reset} `
          const [first, marker] = renderCaret(w.line, w.column, w.endColumn).split('\n')
          console.log(`${lineLabel}${first}`)
          console.log(`    ${COLOR.dim}      │${COLOR.reset} ${marker}`)
        }
      }
    }
    else {
      // Compact: top N rules by count
      const sorted = [...r.issuesByRule.entries()].sort((a, b) => b[1] - a[1])
      for (const [rule, count] of sorted.slice(0, MAX_RULE_PREVIEW))
        console.log(`               ${pad(count, 5)} × ${rule}`)
      if (sorted.length > MAX_RULE_PREVIEW)
        console.log(`               ${COLOR.dim}… and ${sorted.length - MAX_RULE_PREVIEW} more rule(s)${COLOR.reset}`)
    }
  }

  // Final summary table
  console.log()
  console.log(`${COLOR.bold}Summary${COLOR.reset}`)
  console.log(`${pad('File', 45)} ${pad('Format', 30)} ${pad('Legs', 6)} ${pad('Issues', 8)}`)
  console.log('─'.repeat(95))
  let failed = 0
  let totalLegs = 0
  let totalIssues = 0
  for (const r of reports) {
    const fileLabel = relative(PROJECT_ROOT, r.filePath)
    if ('error' in r) {
      failed++
      console.log(`${pad(fileLabel.slice(0, 45), 45)} ${COLOR.red}error${COLOR.reset}`)
      continue
    }
    totalLegs += r.legs
    totalIssues += r.warnings.length
    if (r.warnings.length > 0)
      failed++
    const status = r.warnings.length === 0 ? `${COLOR.green}✓${COLOR.reset}` : `${COLOR.red}✗${COLOR.reset}`
    const shortLabel = fileLabel.length > 45 ? `…${fileLabel.slice(-44)}` : fileLabel
    console.log(`${pad(shortLabel, 45)} ${pad(r.category, 30)} ${pad(r.legs, 6)} ${pad(r.warnings.length, 7)} ${status}`)
  }
  console.log('─'.repeat(95))
  console.log(`${pad(`${reports.length} file(s)`, 45)} ${pad(failed === 0 ? 'all valid' : `${failed} with issues`, 30)} ${pad(totalLegs, 6)} ${pad(totalIssues, 7)}`)
  if (!opts.verbose && totalIssues > 0)
    console.log(`\n${COLOR.dim}Run with --verbose for per-issue file:line:col output.${COLOR.reset}`)
}

main().catch((err) => {
  console.error(err)
  exit(1)
})
