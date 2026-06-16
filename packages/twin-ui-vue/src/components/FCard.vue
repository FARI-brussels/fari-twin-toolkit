<script setup lang="ts">
/**
 * Surface container. `tone="surface"` is a light card for light backgrounds;
 * `tone="glass"` is a frosted translucent card with an inner highlight for dark
 * backgrounds (good contrast where the original `bg-white/5` washed out). Set
 * `interactive` for hover lift/emphasis.
 */
withDefaults(
  defineProps<{
    tone?: 'surface' | 'glass'
    interactive?: boolean
  }>(),
  { tone: 'surface' },
)
</script>

<template>
  <div class="f-card" :class="[`f-card--${tone}`, { 'f-card--interactive': interactive }]">
    <slot />
  </div>
</template>

<style scoped>
.f-card {
  position: relative;
  border-radius: 1rem;
  padding: 1.5rem;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease;
}
.f-card--surface {
  background: var(--fari-white, #fff);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}
.f-card--glass {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    0 14px 34px -16px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  -webkit-backdrop-filter: blur(10px) saturate(1.4);
  backdrop-filter: blur(10px) saturate(1.4);
}
.f-card--interactive {
  cursor: pointer;
}
.f-card--interactive:hover {
  transform: translateY(-3px);
}
.f-card--glass.f-card--interactive:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.28);
}
.f-card--surface.f-card--interactive:hover {
  border-color: rgba(15, 23, 42, 0.12);
  box-shadow: 0 10px 26px -10px rgba(15, 23, 42, 0.18);
}
</style>
