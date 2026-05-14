<script setup lang="ts">
import type { FlightLegRecord, ScheduleDataSet } from 'iata-ssim/sds'
import { parseScheduleDataSet } from 'iata-ssim/sds'
import { computed, ref, shallowRef } from 'vue'

type Tab = 'overview' | 'flights' | 'json' | 'warnings'

const text = ref('')
const fileName = ref('')
const parseError = ref<string | null>(null)
const parsedFile = shallowRef<ScheduleDataSet | null>(null)
const parseTime = ref(0)
const activeTab = ref<Tab>('overview')
const flightSearch = ref('')
const flightLimit = ref(100)
const includeRaw = ref(false)
const strict = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const fileSizeKB = computed(() => (text.value.length / 1024).toFixed(1))
const lineCount = computed(() => text.value ? text.value.split(/\r?\n/).length : 0)

function handleFile(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return
  fileName.value = file.name
  file.text().then((content) => {
    text.value = content
    parse()
  })
}

function loadExample(): void {
  text.value = buildExampleDataSet()
  fileName.value = 'example.ssim'
  parse()
}

function clearAll(): void {
  text.value = ''
  fileName.value = ''
  parsedFile.value = null
  parseError.value = null
}

function parse(): void {
  parseError.value = null
  if (!text.value.trim()) {
    parsedFile.value = null
    return
  }
  try {
    const start = performance.now()
    const result = parseScheduleDataSet(text.value, { strict: strict.value })
    parseTime.value = performance.now() - start
    parsedFile.value = result
    if (result.carriers.length > 0)
      activeTab.value = 'overview'
  }
  catch (err) {
    parseError.value = err instanceof Error ? err.message : String(err)
    parsedFile.value = null
  }
}

const allFlightLegs = computed<FlightLegRecord[]>(() => {
  if (!parsedFile.value)
    return []
  return parsedFile.value.carriers.flatMap(c => c.flightLegs)
})

const filteredFlightLegs = computed<FlightLegRecord[]>(() => {
  const q = flightSearch.value.trim().toUpperCase()
  if (!q)
    return allFlightLegs.value
  return allFlightLegs.value.filter(leg =>
    leg.flightNumber.includes(q)
    || leg.departure.station.includes(q)
    || leg.arrival.station.includes(q)
    || leg.airlineDesignator.includes(q)
    || leg.aircraftType.includes(q),
  )
})

const visibleFlightLegs = computed<FlightLegRecord[]>(() =>
  filteredFlightLegs.value.slice(0, flightLimit.value),
)

const recordCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  if (!parsedFile.value)
    return counts
  for (const r of parsedFile.value.records)
    counts[r.type] = (counts[r.type] ?? 0) + 1
  return counts
})

const recordTypeLabel: Record<string, string> = {
  1: 'Header',
  2: 'Carrier',
  3: 'Flight Leg',
  4: 'Segment Data',
  5: 'Trailer',
  0: 'Zero Filler',
  '?': 'Unknown',
}

const jsonView = computed(() => {
  if (!parsedFile.value)
    return null
  const f = parsedFile.value
  const strip = includeRaw.value ? <T>(r: T): T => r : stripRaw
  return {
    header: f.header ? strip(f.header) : null,
    carriers: f.carriers.map(c => ({
      carrier: strip(c.carrier),
      flightLegs: c.flightLegs.map(strip),
      segmentData: c.segmentData.map(strip),
      trailer: c.trailer ? strip(c.trailer) : null,
    })),
    warnings: f.warnings,
    recordSummary: recordCounts.value,
  }
})

function stripRaw<T extends { raw: string }>(record: T): Omit<T, 'raw'> {
  const { raw: _raw, ...rest } = record
  return rest
}

/**
 * Move the textarea caret to (lineNumber, column..endColumn) and scroll it
 * into view. Coordinates are 1-indexed inclusive (matching IATA SSIM spec
 * byte positions). Pass `column` undefined to select the entire line.
 */
function jumpTo(lineNumber: number, column?: number, endColumn?: number): void {
  const ta = textareaRef.value
  if (!ta)
    return
  // Read from `ta.value` (not `text.value`) because HTML textarea normalizes
  // line endings to LF — if we measured offsets from a CRLF-containing ref
  // each `\r` would shift selection by 1 byte per line skipped.
  const source = ta.value
  let offset = 0
  let lineIdx = 1
  while (lineIdx < lineNumber) {
    const nl = source.indexOf('\n', offset)
    if (nl === -1)
      break
    offset = nl + 1
    lineIdx++
  }
  let lineEnd = offset
  while (lineEnd < source.length && source[lineEnd] !== '\n')
    lineEnd++
  const lineLen = lineEnd - offset

  let selStart: number, selEnd: number
  if (column !== undefined && endColumn !== undefined) {
    selStart = offset + Math.max(0, column - 1)
    selEnd = offset + Math.min(lineLen, endColumn)
  }
  else {
    selStart = offset
    selEnd = lineEnd
  }

  ta.focus()
  ta.setSelectionRange(selStart, selEnd)

  const cs = globalThis.getComputedStyle(ta)
  const lineHeightPx = Number.parseFloat(cs.lineHeight) || 18
  const targetTop = (lineNumber - 1) * lineHeightPx
  if (targetTop < ta.scrollTop || targetTop > ta.scrollTop + ta.clientHeight - lineHeightPx)
    ta.scrollTop = Math.max(0, targetTop - ta.clientHeight / 3)
}

function formatDate(d: Date | null): string {
  if (!d)
    return '—'
  return d.toISOString().slice(0, 10)
}

function formatTime(t: { h: number, m: number } | null): string {
  if (!t)
    return '—'
  return `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}`
}

function formatOffset(min: number | null): string {
  if (min === null)
    return '—'
  const sign = min >= 0 ? '+' : '-'
  const abs = Math.abs(min)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

function formatDays(days: number[]): string {
  const names = ['', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  return days.map(d => names[d]).join(' ')
}

function buildExampleDataSet(): string {
  // Header per § 7.5.1: byte 195-200 must be 000001
  const header
    = '1'
    + 'AIRLINE STANDARD SCHEDULE DATA SET'
    + ' '.repeat(156) // 36-191
    + '001' // 192-194: data set serial
    + '000001' // 195-200: record serial

  const carrier
    = '2'
    + 'U'
    + 'XX '
    + ' '.repeat(5)
    + 'S26'
    + ' '
    + '01JAN26'
    + '31DEC26'
    + '15DEC25'
    + 'PLAYGROUND DEMO DATA         '
    + '15DEC25'
    + 'C' // 72: schedule status
    + ' '.repeat(35) // 73-107: creator reference
    + ' ' // 108: duplicate airline marker
    + ' '.repeat(60) // 109-168: general info
    + ' ' // 169: secure flight indicator (2012)
    + ' '.repeat(19) // 170-188: in-flight service
    + ' '.repeat(2) // 189-190: e-ticketing
    + '1200' // 191-194: creation time
    + '000002' // 195-200: serial

  function buildLeg(
    flightNumber: string,
    from: string,
    to: string,
    days: string,
    dep: string,
    arr: string,
    depTime: string,
    arrTime: string,
    acType: string,
    serial: number,
  ): string {
    return '3'
      + ' '
      + 'XX '
      + flightNumber
      + '01'
      + '01'
      + 'J'
      + from
      + to
      + days
      + '1'
      + dep
      + depTime
      + depTime
      + '+0000'
      + '  '
      + arr
      + arrTime
      + arrTime
      + '+0000'
      + '  '
      + acType
      + ' '.repeat(20)
      + ' '.repeat(5)
      + ' '.repeat(10)
      + ' '.repeat(9)
      + ' '.repeat(3)
      + ' '.repeat(5)
      + ' '
      + ' '.repeat(3)
      + ' '.repeat(3)
      + ' '.repeat(3)
      + ' '.repeat(3)
      + ' '.repeat(4)
      + '    '
      + ' '
      + ' '.repeat(11)
      + ' '
      + ' '.repeat(11)
      + 'C8Y180              '
      + '  '
      + serial.toString().padStart(6, '0')
  }

  const trailer
    = '5'
    + ' '
    + 'XX '
    + ' '.repeat(7) // 6-12: release date (blank)
    + ' '.repeat(175) // 13-187: spare
    + '000006' // 188-193: serial check ref
    + 'E' // 194: end-of-file
    + '000007' // 195-200: serial

  const filler = '0'.repeat(200)

  return [
    header,
    filler,
    carrier,
    buildLeg('0100', '01JAN26', '31DEC26', '12345  ', 'AAA', 'BBB', '0800', '1000', '32A', 3),
    buildLeg('0200', '01JAN26', '31MAR26', '   4 67', 'AAA', 'CCC', '1400', '1530', '32A', 4),
    buildLeg('0300', '01APR26', '31DEC26', '1234567', 'BBB', 'AAA', '0700', '0900', '32A', 5),
    buildLeg('0400', '01MAY26', '30SEP26', '      7', 'CCC', 'DDD', '2200', '0030', '738', 6),
    trailer,
    filler,
  ].join('\r\n') + '\r\n'
}
</script>

<template>
  <div class="playground">
    <div class="pg-input-card">
      <div class="pg-input-controls">
        <label class="pg-button pg-button-secondary">
          <span>📁 Upload .ssim file</span>
          <input type="file" accept=".ssim,.txt" @change="handleFile">
        </label>
        <button class="pg-button pg-button-secondary" @click="loadExample">
          🧪 Load example
        </button>
        <button
          v-if="text"
          class="pg-button pg-button-ghost"
          @click="clearAll"
        >
          ✕ Clear
        </button>
        <label class="pg-checkbox" title="Throw on unknown record types or malformed records instead of collecting warnings">
          <input v-model="strict" type="checkbox" @change="parse">
          Strict mode
        </label>
        <span class="pg-spacer" />
        <span v-if="text" class="pg-stat">
          {{ fileName || 'Pasted text' }} · {{ fileSizeKB }} KB · {{ lineCount }} lines
        </span>
      </div>
      <textarea
        ref="textareaRef"
        v-model="text"
        class="pg-textarea"
        rows="8"
        placeholder="Paste SSIM file contents here, or upload a file above…"
        spellcheck="false"
        @input="parse"
      />
    </div>

    <div v-if="parseError" class="pg-error">
      <strong>Parse error:</strong> {{ parseError }}
    </div>

    <div v-if="parsedFile" class="pg-results">
      <div class="pg-tabs">
        <button
          v-for="tab in (['overview', 'flights', 'json', 'warnings'] as Tab[])"
          :key="tab"
          class="pg-tab"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          <template v-if="tab === 'overview'">Overview</template>
          <template v-if="tab === 'flights'">Flight legs ({{ allFlightLegs.length }})</template>
          <template v-if="tab === 'json'">JSON tree</template>
          <template v-if="tab === 'warnings'">Warnings ({{ parsedFile.warnings.length }})</template>
        </button>
        <span class="pg-spacer" />
        <span class="pg-stat">Parsed in {{ parseTime.toFixed(1) }} ms</span>
      </div>

      <div v-if="activeTab === 'overview'" class="pg-panel">
        <div class="pg-grid">
          <div class="pg-stat-card">
            <div class="pg-stat-label">Carriers</div>
            <div class="pg-stat-value">{{ parsedFile.carriers.length }}</div>
          </div>
          <div class="pg-stat-card">
            <div class="pg-stat-label">Flight legs</div>
            <div class="pg-stat-value">{{ allFlightLegs.length }}</div>
          </div>
          <div class="pg-stat-card" :class="parsedFile.warnings.length === 0 ? 'pg-stat-card-ok' : 'pg-stat-card-warn'">
            <div class="pg-stat-label">Warnings</div>
            <div class="pg-stat-value">{{ parsedFile.warnings.length }}</div>
          </div>
        </div>

        <h3>Record breakdown</h3>
        <table class="pg-table pg-table-compact">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(count, type) in recordCounts" :key="type">
              <td><code>{{ type }}</code></td>
              <td>{{ recordTypeLabel[type] ?? 'Unknown' }}</td>
              <td>{{ count }}</td>
            </tr>
          </tbody>
        </table>

        <h3>Carriers</h3>
        <table class="pg-table">
          <thead>
            <tr>
              <th>Airline</th>
              <th>Season</th>
              <th>Valid from</th>
              <th>Valid to</th>
              <th>Time mode</th>
              <th>Status</th>
              <th>Legs</th>
              <th>Segments</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(block, i) in parsedFile.carriers" :key="i">
              <td><strong>{{ block.carrier.airlineDesignator }}</strong></td>
              <td>{{ block.carrier.season || '—' }}</td>
              <td>{{ formatDate(block.carrier.validFrom) }}</td>
              <td>{{ formatDate(block.carrier.validTo) }}</td>
              <td>{{ block.carrier.timeMode }}</td>
              <td>{{ block.carrier.scheduleStatus }}</td>
              <td>{{ block.flightLegs.length }}</td>
              <td>{{ block.segmentData.length }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'flights'" class="pg-panel">
        <div class="pg-toolbar">
          <input
            v-model="flightSearch"
            placeholder="Search by flight #, airport, airline, aircraft…"
            class="pg-search"
          >
          <select v-model.number="flightLimit" class="pg-select">
            <option :value="50">Show 50</option>
            <option :value="100">Show 100</option>
            <option :value="500">Show 500</option>
            <option :value="9999">Show all</option>
          </select>
          <span class="pg-stat">
            Showing {{ visibleFlightLegs.length }} / {{ filteredFlightLegs.length }}
          </span>
        </div>
        <div class="pg-table-wrap">
          <table class="pg-table pg-table-compact">
            <thead>
              <tr>
                <th>Airline</th>
                <th>Flight</th>
                <th>Period</th>
                <th>Days</th>
                <th>Route</th>
                <th>STD</th>
                <th>STA</th>
                <th>UTC</th>
                <th>Aircraft</th>
                <th>Config</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(leg, i) in visibleFlightLegs"
                :key="i"
                class="pg-row-clickable"
                title="Click to jump to this leg in the source"
                @click="jumpTo(leg.lineNumber)"
              >
                <td>{{ leg.airlineDesignator }}</td>
                <td><strong>{{ leg.flightNumber }}</strong></td>
                <td class="pg-nowrap">
                  {{ formatDate(leg.periodFrom) }}<br>
                  <span class="pg-muted">→ {{ formatDate(leg.periodTo) }}</span>
                </td>
                <td class="pg-nowrap pg-mono">
                  {{ formatDays(leg.daysOfOperation) }}
                </td>
                <td class="pg-nowrap">
                  <strong>{{ leg.departure.station }}</strong>
                  →
                  <strong>{{ leg.arrival.station }}</strong>
                </td>
                <td class="pg-mono pg-nowrap">{{ formatTime(leg.departure.stdPassenger) }}</td>
                <td class="pg-mono pg-nowrap">{{ formatTime(leg.arrival.staPassenger) }}</td>
                <td class="pg-mono pg-nowrap">
                  {{ formatOffset(leg.departure.utcOffsetMinutes) }}
                  /
                  {{ formatOffset(leg.arrival.utcOffsetMinutes) }}
                </td>
                <td>{{ leg.aircraftType }}</td>
                <td class="pg-mono pg-truncate">{{ leg.aircraftConfiguration }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'json'" class="pg-panel">
        <div class="pg-toolbar">
          <label class="pg-checkbox">
            <input v-model="includeRaw" type="checkbox">
            Include <code>raw</code> field (200-byte source lines)
          </label>
        </div>
        <div class="pg-tree-wrap">
          <JsonTree v-if="jsonView" :value="jsonView" :default-expand-depth="2" />
        </div>
      </div>

      <div v-if="activeTab === 'warnings'" class="pg-panel">
        <div v-if="parsedFile.warnings.length === 0" class="pg-empty">
          ✓ No warnings — the file parsed cleanly.
        </div>
        <table v-else class="pg-table pg-table-compact">
          <thead>
            <tr>
              <th>Line:Col</th>
              <th>Rule / Message</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(w, i) in parsedFile.warnings"
              :key="i"
              class="pg-row-clickable"
              title="Click to highlight the offending bytes in the source"
              @click="jumpTo(w.lineNumber, w.column, w.endColumn)"
            >
              <td class="pg-mono pg-nowrap">
                {{ w.lineNumber }}<span v-if="w.column !== undefined" class="pg-muted">:{{ w.column }}{{ w.endColumn !== undefined && w.endColumn !== w.column ? `-${w.endColumn}` : '' }}</span>
              </td>
              <td>
                <span v-if="w.rule" class="pg-rule">{{ w.rule }}</span>
                {{ w.rule ? w.message.replace(`${w.rule} — `, '') : w.message }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="!parseError" class="pg-empty">
      Drop a .ssim file above, paste content, or load the example to get started.
    </div>
  </div>
</template>

<style scoped>
.playground {
  --pg-border: var(--vp-c-divider);
  --pg-radius: 8px;
  margin: 16px 0 32px;
}

.pg-input-card {
  border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius);
  background: var(--vp-c-bg-soft);
  padding: 12px;
  margin-bottom: 16px;
}

.pg-input-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.pg-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--pg-border);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: all 0.15s ease;
}

.pg-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.pg-button-secondary {
  background: var(--vp-c-bg);
}

.pg-button-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--vp-c-text-2);
}

.pg-button input[type="file"] {
  display: none;
}

.pg-spacer {
  flex: 1;
}

.pg-stat {
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
}

.pg-textarea {
  width: 100%;
  min-height: 160px;
  padding: 10px;
  border: 1px solid var(--pg-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  white-space: pre;
  overflow-x: auto;
}

.pg-error {
  padding: 12px 16px;
  margin: 12px 0;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
  border: 1px solid var(--vp-c-danger-2);
  border-radius: var(--pg-radius);
}

.pg-results {
  border: 1px solid var(--pg-border);
  border-radius: var(--pg-radius);
  overflow: hidden;
}

.pg-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--pg-border);
  background: var(--vp-c-bg-soft);
  flex-wrap: wrap;
}

.pg-tab {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.pg-tab:hover {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.pg-tab.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.pg-panel {
  padding: 16px;
}

.pg-panel h3 {
  margin: 20px 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pg-panel h3:first-child {
  margin-top: 0;
}

.pg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.pg-stat-card {
  padding: 12px;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  border: 1px solid transparent;
}

.pg-stat-card-ok {
  background: var(--vp-c-success-soft, rgb(80 200 120 / 12%));
  border-color: var(--vp-c-success-2, rgb(80 200 120 / 35%));
}

.pg-stat-card-warn {
  background: var(--vp-c-warning-soft, rgb(234 179 8 / 12%));
  border-color: var(--vp-c-warning-2, rgb(234 179 8 / 35%));
}

.pg-stat-label {
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}

.pg-stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  word-break: break-word;
}

.pg-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.pg-search {
  flex: 1;
  min-width: 200px;
  padding: 6px 10px;
  border: 1px solid var(--pg-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.pg-select {
  padding: 6px 10px;
  border: 1px solid var(--pg-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.pg-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.pg-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--pg-border);
  border-radius: 6px;
}

.pg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.pg-table th,
.pg-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--pg-border);
}

.pg-table th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.pg-table-compact th,
.pg-table-compact td {
  padding: 5px 8px;
}

.pg-table tbody tr:hover {
  background: var(--vp-c-bg-soft);
}

.pg-row-clickable {
  cursor: pointer;
}

.pg-row-clickable:hover {
  background: var(--vp-c-brand-soft) !important;
}

.pg-rule {
  display: inline-block;
  margin-right: 8px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.pg-mono {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}

.pg-nowrap {
  white-space: nowrap;
}

.pg-truncate {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pg-muted {
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.pg-tree-wrap {
  max-height: 600px;
  overflow: auto;
  padding: 8px;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
}

.pg-empty {
  padding: 24px;
  text-align: center;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border-radius: var(--pg-radius);
  font-size: 14px;
}
</style>
