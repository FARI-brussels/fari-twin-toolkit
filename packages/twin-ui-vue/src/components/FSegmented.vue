<script setup lang="ts">
/**
 * iOS-style segmented control: an animated thumb slides under (and is sized to)
 * the active option. `v-model` holds the selected value. Options may carry an
 * optional icon. Segments are content-width and the thumb is measured from the
 * active button, so labels of different lengths line up correctly.
 */
import { ref, watch, onMounted, onBeforeUnmount, nextTick, type Component } from 'vue'

interface SegmentOption {
  value: string
  label: string
  icon?: Component
}

const props = defineProps<{
  modelValue: string
  options: SegmentOption[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rootRef = ref<HTMLElement | null>(null)
const thumbLeft = ref(0)
const thumbWidth = ref(0)
let ro: ResizeObserver | null = null

function measure(): void {
  const root = rootRef.value
  if (!root) return
  const active = root.querySelector<HTMLElement>('.f-seg__opt[aria-selected="true"]')
  if (!active) {
    thumbWidth.value = 0
    return
  }
  thumbLeft.value = active.offsetLeft
  thumbWidth.value = active.offsetWidth
}

onMounted(() => {
  measure()
  ro = new ResizeObserver(() => measure())
  if (rootRef.value) ro.observe(rootRef.value)
})
onBeforeUnmount(() => ro?.disconnect())
watch(
  () => [props.modelValue, props.options] as const,
  () => nextTick(measure),
  { deep: true },
)
</script>

<template>
  <div ref="rootRef" class="f-seg" role="tablist">
    <span
      class="f-seg__thumb"
      aria-hidden="true"
      :style="{
        transform: `translateX(${thumbLeft}px)`,
        width: `${thumbWidth}px`,
        opacity: thumbWidth ? 1 : 0,
      }"
    />
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="tab"
      :aria-selected="opt.value === modelValue"
      class="f-seg__opt"
      :class="{ 'is-active': opt.value === modelValue }"
      @click="emit('update:modelValue', opt.value)"
    >
      <component :is="opt.icon" v-if="opt.icon" class="f-seg__icon" />
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.f-seg {
  position: relative;
  display: inline-flex;
  padding: 4px;
  border-radius: 0.75rem;
  background: var(--fari-segmented-track, rgba(118, 118, 128, 0.12));
  isolation: isolate;
}
.f-seg__thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  border-radius: 0.55rem;
  background: var(--fari-white, #fff);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 1px rgba(0, 0, 0, 0.04);
  transition:
    transform 0.3s cubic-bezier(0.32, 0.72, 0, 1),
    width 0.3s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s;
  z-index: 0;
}
.f-seg__opt {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  padding: 0.55em 1.15em;
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--fari-font-primary, 'Montserrat', sans-serif);
  font-size: var(--fari-font-size-body-sm, 0.833rem);
  font-weight: var(--fari-font-weight-medium, 500);
  color: var(--fari-segmented-fg, #4b5563);
  transition:
    color 0.2s,
    transform 0.1s;
}
.f-seg__opt.is-active {
  color: var(--fari-blue, #183e91);
  font-weight: var(--fari-font-weight-semibold, 600);
}
.f-seg__opt:active {
  transform: scale(0.97);
}
.f-seg__opt:focus-visible {
  outline: 2px solid var(--fari-web-blue, #2e4fbf);
  outline-offset: 2px;
  border-radius: 0.55rem;
}
.f-seg__icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}
</style>
