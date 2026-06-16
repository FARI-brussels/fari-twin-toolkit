<script setup lang="ts">
import { computed } from 'vue'
import { FYearSlider, FChoroplethLegend, FButton } from '@fari-brussels/twin-ui-vue'
import { tokens } from '@fari-brussels/twin-ui-tokens'
import { valueOf } from '@fari-brussels/scenario-engine'
import { activeIndicator, clearAllOverrides, dataset, overrideFor, state } from '../state'
import { indicators, places, years } from '../data'

const activePlace = computed(() =>
  state.activePlaceId ? (places.find((p) => p.id === state.activePlaceId) ?? null) : null,
)

const allValues = computed(() => {
  const period = String(state.activeYear)
  return dataset.values
    .filter(
      (v) => v.indicator_key === state.activeIndicator && v.period === period && v.value != null,
    )
    .map((v) => v.value as number)
})

const min = computed(() => (allValues.value.length ? Math.min(...allValues.value) : 0))
const max = computed(() => (allValues.value.length ? Math.max(...allValues.value) : 100))

const legendStops = computed(() => {
  const teal = tokens.brandColors.lighthouseBlue
  const red = tokens.statusColors.notOk
  return activeIndicator.value.higher_is_better
    ? [
        { value: Math.round(min.value), color: red },
        { value: Math.round(max.value), color: teal },
      ]
    : [
        { value: Math.round(min.value), color: teal },
        { value: Math.round(max.value), color: red },
      ]
})

const activeValue = computed(() => {
  if (!activePlace.value) return null
  const v = valueOf(dataset, activePlace.value.id, state.activeIndicator, String(state.activeYear))
  return typeof v === 'number' ? v : null
})

const activeOverride = computed(() =>
  activePlace.value ? overrideFor(activePlace.value.id, state.activeIndicator) : undefined,
)
</script>

<template>
  <aside class="sidebar">
    <section>
      <h3>Indicator</h3>
      <select v-model="state.activeIndicator" class="select">
        <option v-for="ind in indicators" :key="ind.key" :value="ind.key">
          {{ ind.label }}
        </option>
      </select>
      <p class="hint">{{ activeIndicator.description }}</p>
    </section>

    <section>
      <h3>Year</h3>
      <FYearSlider
        v-model="state.activeYear"
        :min-year="years[0]!"
        :max-year="years[years.length - 1]!"
        label="Year"
      />
    </section>

    <section>
      <h3>Legend</h3>
      <FChoroplethLegend
        :title="activeIndicator.label"
        :unit="activeIndicator.unit ?? undefined"
        :stops="legendStops"
      />
    </section>

    <section>
      <h3>Selected commune</h3>
      <div v-if="activePlace" class="card">
        <div class="card-title">{{ activePlace.name }}</div>
        <div class="card-row">
          <span>{{ activeIndicator.label }} ({{ state.activeYear }})</span>
          <strong>{{ activeValue ?? '—' }} {{ activeIndicator.unit ?? '' }}</strong>
        </div>
        <div v-if="activeOverride != null" class="card-row override">
          <span>What-if value</span>
          <strong>{{ activeOverride }}</strong>
        </div>
      </div>
      <p v-else class="hint">Click a commune on the map.</p>
    </section>

    <section v-if="state.overrides.length > 0">
      <FButton variant="ghost" size="sm" @click="clearAllOverrides">Clear all overrides</FButton>
    </section>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem 1.1rem;
  overflow-y: auto;
  background: #fafbfd;
  border-right: 1px solid #eceff5;
}
h3 {
  margin: 0 0 0.5rem;
  font-size: var(--fari-font-size-caption);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--fari-blue);
}
.select {
  width: 100%;
  font: inherit;
  font-size: var(--fari-font-size-body-sm);
  padding: 0.45rem 0.6rem;
  border: 1px solid #d3d8e3;
  border-radius: 0.35rem;
  background: white;
}
.hint {
  margin: 0.5rem 0 0;
  font-size: var(--fari-font-size-caption);
  color: var(--fari-black);
  opacity: 0.7;
  line-height: 1.5;
}
.card {
  border: 1px solid #eceff5;
  border-radius: 0.5rem;
  padding: 0.7rem 0.85rem;
  background: white;
}
.card-title {
  font-weight: var(--fari-font-weight-bold);
  color: var(--fari-blue);
  margin-bottom: 0.4rem;
}
.card-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  font-size: var(--fari-font-size-body-sm);
  padding: 0.2rem 0;
}
.card-row.override strong {
  color: var(--fari-lighthouse);
}
</style>
