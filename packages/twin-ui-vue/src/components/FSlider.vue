<script setup lang="ts">
/** Numeric range input. v-model is a number. */
const model = defineModel<number>({ default: 0 })
withDefaults(
  defineProps<{
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    ariaLabel?: string
  }>(),
  { min: 0, max: 100, step: 1 },
)

const onInput = (event: Event) => {
  model.value = Number((event.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    type="range"
    class="f-slider"
    :min="min"
    :max="max"
    :step="step"
    :value="model"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @input="onInput"
  />
</template>

<style scoped>
.f-slider {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: #d8dde7;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}
.f-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.f-slider:focus-visible {
  outline: 2px solid var(--fari-web-blue, #2e4fbf);
  outline-offset: 4px;
}
.f-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--fari-web-blue, #2e4fbf);
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.1s;
}
.f-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}
.f-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--fari-web-blue, #2e4fbf);
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}
</style>
