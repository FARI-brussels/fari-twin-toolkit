<script setup lang="ts">
/** Year picker — domain widget from BrusselsMigration. Composes FSlider. */
import FSlider from './FSlider.vue'

const model = defineModel<number>({ required: true })
withDefaults(
  defineProps<{
    minYear: number
    maxYear: number
    step?: number
    label?: string
  }>(),
  { step: 1 },
)
</script>

<template>
  <div class="f-year-slider">
    <div class="f-year-slider__row">
      <span class="f-year-slider__value">{{ model }}</span>
      <FSlider
        v-model="model"
        :min="minYear"
        :max="maxYear"
        :step="step"
        :aria-label="label ?? 'Year'"
      />
    </div>
    <div class="f-year-slider__range">
      <span>{{ minYear }}</span
      ><span>{{ maxYear }}</span>
    </div>
  </div>
</template>

<style scoped>
.f-year-slider {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-family: var(--fari-font-primary, 'Montserrat', sans-serif);
}
.f-year-slider__row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.f-year-slider__value {
  font-size: var(--fari-font-size-h2, 1.2rem);
  font-weight: var(--fari-font-weight-bold, 700);
  color: var(--fari-web-blue, #2e4fbf);
  min-width: 3.5ch;
  font-variant-numeric: tabular-nums;
}
.f-year-slider__range {
  display: flex;
  justify-content: space-between;
  font-size: var(--fari-font-size-caption, 0.694rem);
  color: var(--fari-black, #181716);
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
</style>
