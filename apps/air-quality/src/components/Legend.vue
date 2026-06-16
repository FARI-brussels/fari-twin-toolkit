<script setup lang="ts">
import { computed } from 'vue'
import { activeNorm, activeSource, state } from '../state'

/** Each stop's colour holds until the next stop — turn that into legend bands. */
const bands = computed(() => {
  const stops = activeNorm.value.stops
  return stops.map((stop, i) => {
    const next = stops[i + 1]
    const label = next
      ? i === 0
        ? `< ${next.value}`
        : `${stop.value}–${next.value}`
      : `≥ ${stop.value}`
    return { color: stop.color, label }
  })
})
</script>

<template>
  <section class="legend">
    <div class="head">
      <span class="title">NO₂</span>
      <span class="unit">{{ activeSource.unit }}</span>
    </div>
    <ul class="bands">
      <li v-for="band in bands" :key="band.label" class="band">
        <span class="swatch" :style="{ background: band.color }" />
        <span class="range">{{ band.label }}</span>
      </li>
    </ul>
    <p v-if="state.stats" class="stats">
      <strong>{{ state.stats.count.toLocaleString() }}</strong> points ·
      {{ state.stats.min.toFixed(1) }}–{{ state.stats.max.toFixed(1) }} {{ activeSource.unit }}
    </p>
    <p v-if="state.loading" class="loading">Loading…</p>
  </section>
</template>

<style scoped>
.legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.head {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}
.title {
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fari-blue);
  opacity: 0.75;
}
.unit {
  font-size: var(--fari-font-size-micro);
  color: rgba(10, 18, 48, 0.55);
}
.bands {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.band {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.swatch {
  width: 1.1rem;
  height: 0.85rem;
  border-radius: 0.2rem;
  box-shadow: inset 0 0 0 1px rgba(10, 18, 48, 0.12);
  transition: background 0.3s ease;
}
.range {
  font-size: var(--fari-font-size-caption);
  color: rgba(10, 18, 48, 0.85);
  font-variant-numeric: tabular-nums;
}
.stats {
  margin: 0.2rem 0 0;
  font-size: var(--fari-font-size-caption);
  color: rgba(10, 18, 48, 0.7);
}
.stats strong {
  color: var(--aq-ink);
}
.loading {
  margin: 0;
  font-size: var(--fari-font-size-caption);
  color: var(--fari-blue);
}
</style>
