<script setup lang="ts">
import { computed } from 'vue'
import { activeNorm, activeSource, state } from '../state'

const HIDDEN_KEYS = new Set(['value', 'no2', 'lng', 'lat', 'cnId', 'id'])

const verdict = computed(() => {
  const sel = state.selected
  const limit = activeNorm.value.limit
  if (!sel || limit == null) return null
  const over = sel.value >= limit
  return {
    over,
    text: over
      ? `Over the ${activeNorm.value.label} limit`
      : `Within the ${activeNorm.value.label} limit`,
    limit,
  }
})

/** Source-specific extras worth showing (street type, traffic, neighbourhood…). */
const details = computed(() => {
  const props = state.selected?.properties ?? {}
  return Object.entries(props)
    .filter(([k, v]) => !HIDDEN_KEYS.has(k) && (typeof v === 'string' || typeof v === 'number'))
    .slice(0, 6)
    .map(([k, v]) => ({ key: prettify(k), value: String(v) }))
})

function prettify(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase())
}
</script>

<template>
  <transition name="slide">
    <aside v-if="state.selected" class="detail">
      <button class="close" aria-label="Close" @click="state.selected = null">×</button>
      <div class="value-row">
        <span class="value">{{ state.selected.value.toFixed(1) }}</span>
        <span class="unit">{{ activeSource.unit }} NO₂</span>
      </div>
      <div v-if="verdict" class="verdict" :class="{ over: verdict.over, within: !verdict.over }">
        {{ verdict.text }} ({{ verdict.limit }})
      </div>
      <dl v-if="details.length" class="props">
        <template v-for="d in details" :key="d.key">
          <dt>{{ d.key }}</dt>
          <dd>{{ d.value }}</dd>
        </template>
      </dl>
      <p v-if="state.selected.lat != null" class="coords">
        {{ state.selected.lat.toFixed(5) }}, {{ state.selected.lon?.toFixed(5) }}
      </p>
    </aside>
  </transition>
</template>

<style scoped>
.detail {
  position: relative;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--aq-panel);
  backdrop-filter: blur(10px);
  border: 1px solid var(--aq-line);
  border-radius: 0.9rem;
  box-shadow: var(--aq-shadow);
  padding: 1rem;
}
.close {
  position: absolute;
  top: -0.35rem;
  right: -0.35rem;
  width: 1.6rem;
  height: 1.6rem;
  border: 0;
  border-radius: 50%;
  background: rgba(24, 62, 145, 0.08);
  color: var(--aq-ink);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}
.close:hover {
  background: rgba(24, 62, 145, 0.16);
}
.value-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}
.value {
  font-size: var(--fari-font-size-h1);
  font-weight: var(--fari-font-weight-extrabold);
  color: var(--aq-ink);
  line-height: 1;
}
.unit {
  font-size: var(--fari-font-size-caption);
  color: rgba(10, 18, 48, 0.6);
}
.verdict {
  align-self: flex-start;
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-bold);
  padding: 0.25rem 0.6rem;
  border-radius: 2rem;
}
.verdict.over {
  background: rgba(179, 42, 45, 0.12);
  color: #b32a2d;
}
.verdict.within {
  background: rgba(43, 182, 115, 0.14);
  color: #1f8d59;
}
.props {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.2rem 0.8rem;
  margin: 0;
  font-size: var(--fari-font-size-caption);
}
.props dt {
  color: rgba(10, 18, 48, 0.55);
}
.props dd {
  margin: 0;
  text-align: right;
  color: var(--aq-ink);
  font-weight: var(--fari-font-weight-semibold);
}
.coords {
  margin: 0;
  font-size: var(--fari-font-size-micro);
  color: rgba(10, 18, 48, 0.5);
  font-variant-numeric: tabular-nums;
}
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
