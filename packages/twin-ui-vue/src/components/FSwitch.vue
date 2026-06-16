<script setup lang="ts">
/** Accessible on/off toggle. v-model is a boolean. */
const model = defineModel<boolean>({ default: false })
withDefaults(defineProps<{ disabled?: boolean; label?: string }>(), {})

const toggle = () => {
  model.value = !model.value
}
const onKey = (e: KeyboardEvent) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    :disabled="disabled"
    class="f-switch"
    :class="{ 'is-on': model }"
    @click="toggle"
    @keydown="onKey"
  >
    <span class="f-switch__track"><span class="f-switch__thumb" /></span>
    <span v-if="label" class="f-switch__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.f-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-family: var(--fari-font-primary, 'Montserrat', sans-serif);
  font-size: var(--fari-font-size-body-sm, 0.833rem);
  color: inherit;
}
.f-switch:focus-visible {
  outline: 2px solid var(--fari-web-blue, #2e4fbf);
  outline-offset: 3px;
  border-radius: 0.25em;
}
.f-switch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.f-switch__track {
  position: relative;
  width: 2.4em;
  height: 1.35em;
  border-radius: 1em;
  background: #c8d0dd;
  transition: background 0.18s;
}
.f-switch.is-on .f-switch__track {
  background: var(--fari-lighthouse, #64d8bf);
}
.f-switch__thumb {
  position: absolute;
  top: 50%;
  left: 0.15em;
  width: 1.05em;
  height: 1.05em;
  border-radius: 50%;
  background: #fff;
  transform: translateY(-50%);
  transition: left 0.18s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
.f-switch.is-on .f-switch__thumb {
  left: calc(100% - 1.2em);
}
</style>
