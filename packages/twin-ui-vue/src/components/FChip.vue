<script setup lang="ts">
/**
 * Small status/label chip (pill). `variant` picks a tonal color pairing;
 * content (text and/or an icon) goes in the default slot.
 */
withDefaults(
  defineProps<{
    variant?: 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger'
    size?: 'sm' | 'md'
  }>(),
  { variant: 'neutral', size: 'md' },
)
</script>

<template>
  <span class="f-chip" :class="[`f-chip--${variant}`, `f-chip--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.f-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  border-radius: 999px;
  font-family: var(--fari-font-primary, 'Montserrat', sans-serif);
  font-weight: var(--fari-font-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}
.f-chip--sm {
  font-size: 0.7rem;
  padding: 0.28em 0.62em;
}
.f-chip--md {
  font-size: 0.75rem;
  padding: 0.34em 0.72em;
}
.f-chip--neutral {
  background: rgba(100, 116, 139, 0.14);
  color: #475569;
}
.f-chip--brand {
  background: rgba(46, 79, 191, 0.12);
  color: var(--fari-web-blue, #2e4fbf);
}
.f-chip--info {
  background: rgba(14, 165, 233, 0.14);
  color: #0284c7;
}
.f-chip--success {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}
.f-chip--warning {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}
.f-chip--danger {
  background: rgba(239, 68, 68, 0.14);
  color: #dc2626;
}
</style>
