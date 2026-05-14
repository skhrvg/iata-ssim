<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  value: unknown
  name?: string
  depth?: number
  defaultExpandDepth?: number
}>(), {
  depth: 0,
  defaultExpandDepth: 2,
})

const expanded = ref(props.depth < props.defaultExpandDepth)

function toggle(): void {
  expanded.value = !expanded.value
}

const kind = computed<'null' | 'undefined' | 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'>(() => {
  const v = props.value
  if (v === null)
    return 'null'
  if (v === undefined)
    return 'undefined'
  if (v instanceof Date)
    return 'date'
  if (Array.isArray(v))
    return 'array'
  return typeof v as 'string' | 'number' | 'boolean' | 'object'
})

const entries = computed<[string, unknown][]>(() => {
  if (kind.value === 'array')
    return (props.value as unknown[]).map((v, i) => [String(i), v])
  if (kind.value === 'object')
    return Object.entries(props.value as Record<string, unknown>)
  return []
})

const summary = computed<string>(() => {
  if (kind.value === 'array')
    return `Array(${(props.value as unknown[]).length})`
  if (kind.value === 'object') {
    const keys = Object.keys(props.value as Record<string, unknown>)
    return `Object{${keys.length}}`
  }
  return ''
})

function formatPrimitive(v: unknown, k: typeof kind.value): string {
  if (k === 'null')
    return 'null'
  if (k === 'undefined')
    return 'undefined'
  if (k === 'string')
    return JSON.stringify(v)
  if (k === 'date')
    return (v as Date).toISOString()
  return String(v)
}

const isContainer = computed(() => kind.value === 'array' || kind.value === 'object')
</script>

<template>
  <div class="jt-row">
    <span
      v-if="isContainer"
      class="jt-toggle"
      :class="{ open: expanded }"
      @click="toggle"
    >▶</span>
    <span v-if="name !== undefined" class="jt-key">{{ name }}:</span>
    <template v-if="!isContainer">
      <span class="jt-value" :class="`jt-${kind}`">{{ formatPrimitive(value, kind) }}</span>
    </template>
    <template v-else>
      <span class="jt-summary" @click="toggle">{{ summary }}</span>
      <div v-if="expanded" class="jt-children">
        <JsonTree
          v-for="[key, child] in entries"
          :key="key"
          :name="key"
          :value="child"
          :depth="depth + 1"
          :default-expand-depth="defaultExpandDepth"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.jt-row {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  padding-left: 0;
}

.jt-toggle {
  display: inline-block;
  width: 12px;
  font-size: 10px;
  cursor: pointer;
  user-select: none;
  color: var(--vp-c-text-2);
  transition: transform 0.15s ease;
  margin-right: 2px;
}

.jt-toggle.open {
  transform: rotate(90deg);
}

.jt-key {
  color: var(--vp-c-brand-1);
  margin-right: 6px;
}

.jt-summary {
  color: var(--vp-c-text-2);
  cursor: pointer;
  user-select: none;
}

.jt-summary:hover {
  color: var(--vp-c-brand-1);
}

.jt-children {
  padding-left: 18px;
  border-left: 1px dashed var(--vp-c-divider);
  margin-left: 4px;
}

.jt-value {
  font-weight: 500;
}

.jt-string {
  color: #5fa17a;
}

.jt-number {
  color: #b8860b;
}

.jt-boolean {
  color: #d4a26a;
}

.jt-null,
.jt-undefined {
  color: var(--vp-c-text-3);
  font-style: italic;
}

.jt-date {
  color: #8b5cf6;
}

.dark .jt-string {
  color: #86c393;
}

.dark .jt-number {
  color: #e8c267;
}

.dark .jt-date {
  color: #c4a8f7;
}
</style>
