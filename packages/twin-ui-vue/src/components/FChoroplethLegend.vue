<script setup lang="ts">
/**
 * Color-ramp legend matching viewer-core's StyleSpec.colorBy stops. Pass the
 * same stops you give to the viewer and the legend visualizes the gradient.
 */
import { computed } from 'vue'

export interface ColorStop {
  value: number
  color: string
}

const props = defineProps<{
  stops: ColorStop[]
  title?: string
  unit?: string
}>()

const sorted = computed(() => [...props.stops].sort((a, b) => a.value - b.value))

const gradient = computed(() => {
  const s = sorted.value
  if (s.length === 0) return 'transparent'
  if (s.length === 1) return s[0]!.color
  const min = s[0]!.value
  const max = s[s.length - 1]!.value
  const span = max - min || 1
  const css = s
    .map((stop) => `${stop.color} ${(((stop.value - min) / span) * 100).toFixed(1)}%`)
    .join(', ')
  return `linear-gradient(90deg, ${css})`
})
</script>

<template>
  <figure class="f-legend">
    <figcaption v-if="title" class="f-legend__title">
      {{ title }}<span v-if="unit" class="f-legend__unit"> ({{ unit }})</span>
    </figcaption>
    <div class="f-legend__bar" :style="{ background: gradient }" />
    <div class="f-legend__ticks">
      <span v-for="stop in sorted" :key="stop.value">{{ stop.value }}</span>
    </div>
  </figure>
</template>

<style scoped>
.f-legend {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
  font-family: var(--fari-font-primary, 'Montserrat', sans-serif);
  font-size: var(--fari-font-size-caption, 0.694rem);
}
.f-legend__title {
  font-weight: var(--fari-font-weight-semibold, 600);
  color: var(--fari-black, #181716);
}
.f-legend__unit {
  font-weight: var(--fari-font-weight-regular, 400);
  opacity: 0.65;
}
.f-legend__bar {
  height: 0.6rem;
  border-radius: 999px;
}
.f-legend__ticks {
  display: flex;
  justify-content: space-between;
  color: var(--fari-black, #181716);
  opacity: 0.65;
  font-variant-numeric: tabular-nums;
}
</style>
