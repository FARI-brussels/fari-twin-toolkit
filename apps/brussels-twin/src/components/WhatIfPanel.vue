<script setup lang="ts">
import { computed } from 'vue'
import { FButton, FSlider } from '@fari-brussels/twin-ui-vue'
import { predictIndicator, valueOf } from '@fari-brussels/scenario-engine'
import {
  activeIndicator,
  clearOverride,
  dataset,
  driverIndicator,
  overrideFor,
  setOverride,
  state,
} from '../state'
import { indicators, places } from '../data'

const period = computed(() => String(state.activeYear))
const place = computed(() =>
  state.activePlaceId ? (places.find((p) => p.id === state.activePlaceId) ?? null) : null,
)

// Driver options = every indicator other than the active outcome.
const driverOptions = computed(() => indicators.filter((i) => i.key !== state.activeIndicator))

// Drive value bounds across all places at this period (so the slider range feels right).
const driverRange = computed(() => {
  const values = dataset.values
    .filter(
      (v) =>
        v.indicator_key === state.driverIndicator && v.period === period.value && v.value != null,
    )
    .map((v) => v.value as number)
  return {
    min: values.length ? Math.floor(Math.min(...values)) : 0,
    max: values.length ? Math.ceil(Math.max(...values)) : 100,
  }
})

const baselineDriver = computed(() => {
  if (!place.value) return null
  const v = valueOf(dataset, place.value.id, state.driverIndicator, period.value)
  return typeof v === 'number' ? v : null
})

const currentDriverValue = computed({
  get(): number {
    if (!place.value) return 0
    const override = overrideFor(place.value.id, state.driverIndicator)
    return override ?? baselineDriver.value ?? 0
  },
  set(v: number) {
    if (!place.value) return
    setOverride({ place_id: place.value.id, indicator_key: state.driverIndicator, value: v })
  },
})

const prediction = computed(() => {
  if (!place.value) return null
  return predictIndicator({
    dataset,
    driverKey: state.driverIndicator,
    outcomeKey: state.activeIndicator,
    placeId: place.value.id,
    period: period.value,
    model: 'linear',
    overrides: state.overrides,
  })
})

function resetDriver() {
  if (!place.value) return
  clearOverride(place.value.id, state.driverIndicator)
}

function fmt(n: number | null | undefined, digits = 1): string {
  return typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : '—'
}
</script>

<template>
  <section class="whatif">
    <header>
      <h2>What if…</h2>
      <span v-if="prediction" class="r2">model fit R² = {{ fmt(prediction.r2, 3) }}</span>
    </header>

    <div v-if="!place" class="empty">Click a commune to start a what-if for it.</div>

    <div v-else class="grid">
      <div>
        <label>Driver indicator</label>
        <select v-model="state.driverIndicator" class="select">
          <option v-for="ind in driverOptions" :key="ind.key" :value="ind.key">
            {{ ind.label }}
          </option>
        </select>
        <p class="muted">Move this slider; the predicted outcome updates.</p>
      </div>

      <div>
        <label>
          {{ driverIndicator.label }} in {{ place.name }} ({{ state.activeYear }})
          <span class="meta">baseline {{ fmt(baselineDriver) }}</span>
        </label>
        <div class="slider-row">
          <FSlider
            v-model="currentDriverValue"
            :min="driverRange.min"
            :max="driverRange.max"
            :step="0.1"
            :aria-label="`${driverIndicator.label} for ${place.name}`"
          />
          <strong class="value">{{ fmt(currentDriverValue) }}</strong>
        </div>
      </div>

      <div v-if="prediction" class="result">
        <label>Predicted {{ activeIndicator.label }}</label>
        <div class="result-row">
          <div>
            <span class="muted">Baseline</span>
            <strong>{{ fmt(prediction.baseline) }}</strong>
          </div>
          <div>
            <span class="muted">Predicted</span>
            <strong class="predicted">{{ fmt(prediction.predicted) }}</strong>
          </div>
          <div>
            <span class="muted">Δ</span>
            <strong :class="delta(prediction.delta)">
              {{ prediction.delta != null && prediction.delta >= 0 ? '+' : ''
              }}{{ fmt(prediction.delta, 2) }}
            </strong>
          </div>
        </div>
        <FButton variant="ghost" size="sm" @click="resetDriver">Reset driver</FButton>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { activeIndicator as actInd } from '../state'
function delta(d: number | null | undefined): string {
  if (d == null) return ''
  const better =
    (actInd.value.higher_is_better && d > 0) || (!actInd.value.higher_is_better && d < 0)
  if (Math.abs(d) < 0.01) return 'neutral'
  return better ? 'good' : 'bad'
}
export default { name: 'WhatIfPanel' }
</script>

<style scoped>
.whatif {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: white;
  border-top: 1px solid #eceff5;
}
header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}
h2 {
  margin: 0;
  font-size: var(--fari-font-size-h2);
  color: var(--fari-blue);
}
.r2 {
  font-size: var(--fari-font-size-caption);
  color: var(--fari-black);
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
.empty {
  color: var(--fari-black);
  opacity: 0.65;
  font-size: var(--fari-font-size-body-sm);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.25rem;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
label {
  display: block;
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-semibold);
  color: var(--fari-blue);
  margin-bottom: 0.4rem;
}
.meta {
  margin-left: 0.5rem;
  font-weight: var(--fari-font-weight-regular);
  opacity: 0.65;
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
.muted {
  display: block;
  font-size: var(--fari-font-size-caption);
  color: var(--fari-black);
  opacity: 0.6;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.value {
  min-width: 4ch;
  text-align: right;
  color: var(--fari-web-blue);
  font-variant-numeric: tabular-nums;
}
.result {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.result-row {
  display: flex;
  gap: 1rem;
  font-variant-numeric: tabular-nums;
}
.result-row div {
  display: flex;
  flex-direction: column;
}
.result-row strong {
  font-size: var(--fari-font-size-h2);
  color: var(--fari-blue);
}
.result-row .predicted {
  color: var(--fari-web-blue);
}
.good {
  color: var(--fari-status-ok) !important;
}
.bad {
  color: var(--fari-status-not-ok) !important;
}
.neutral {
  color: var(--fari-black) !important;
  opacity: 0.6;
}
</style>
