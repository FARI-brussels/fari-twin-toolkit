<script setup lang="ts">
/**
 * Branded checkbox with an animated tick. `v-model` holds the boolean. The
 * checked accent is themable via `--fari-checkbox-accent` (defaults to brand
 * blue). Label content goes in the default slot.
 */
defineProps<{ modelValue: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <label class="f-check" :class="{ 'is-disabled': disabled }">
    <input
      type="checkbox"
      class="f-check__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="f-check__box">
      <svg class="f-check__tick" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3.5 8.5l3 3 6-7"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span v-if="$slots.default" class="f-check__label"><slot /></span>
  </label>
</template>

<style scoped>
.f-check {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  cursor: pointer;
  user-select: none;
  font-family: var(--fari-font-primary, 'Montserrat', sans-serif);
  font-size: var(--fari-font-size-body-sm, 0.833rem);
  font-weight: var(--fari-font-weight-medium, 500);
  color: inherit;
}
.f-check.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.f-check__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.f-check__box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25em;
  height: 1.25em;
  flex-shrink: 0;
  border-radius: 0.4em;
  border: 1.5px solid var(--fari-checkbox-border, rgba(120, 120, 128, 0.55));
  background: var(--fari-checkbox-bg, #fff);
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.f-check__tick {
  width: 0.9em;
  height: 0.9em;
  color: #fff;
  transform: scale(0);
  transition: transform 0.2s cubic-bezier(0.2, 1.4, 0.4, 1);
}
.f-check__input:checked + .f-check__box {
  background: var(--fari-checkbox-accent, var(--fari-blue, #183e91));
  border-color: var(--fari-checkbox-accent, var(--fari-blue, #183e91));
}
.f-check__input:checked + .f-check__box .f-check__tick {
  transform: scale(1);
}
.f-check__input:focus-visible + .f-check__box {
  outline: 2px solid var(--fari-web-blue, #2e4fbf);
  outline-offset: 2px;
}
</style>
