<script setup lang="ts">
/**
 * Primary action button. Variants reflect FARI brand pairing (primary = brand
 * blue, secondary = outlined, ghost = transparent). Native `click` falls through
 * — no need to re-declare emits. Attributes (class, style, type, …) inherit.
 */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'gradient'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)
</script>

<template>
  <button
    :type="type"
    class="f-btn"
    :class="[
      `f-btn--${variant}`,
      `f-btn--${size}`,
      { 'f-btn--block': block, 'is-loading': loading },
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="f-btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.f-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  font-family: var(--fari-font-primary, 'Montserrat', sans-serif);
  font-weight: var(--fari-font-weight-semibold, 600);
  line-height: 1;
  border: 1px solid transparent;
  border-radius: 0.4em;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s,
    opacity 0.15s;
  user-select: none;
}
.f-btn:focus-visible {
  outline: 2px solid var(--fari-web-blue, #2e4fbf);
  outline-offset: 2px;
}
.f-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.f-btn--block {
  display: flex;
  width: 100%;
}

/* sizes */
.f-btn--sm {
  font-size: var(--fari-font-size-caption, 0.694rem);
  padding: 0.45em 0.9em;
}
.f-btn--md {
  font-size: var(--fari-font-size-body-sm, 0.833rem);
  padding: 0.7em 1.35em;
}
.f-btn--lg {
  font-size: var(--fari-font-size-body, 1rem);
  padding: 0.85em 1.7em;
}

/* variants */
.f-btn--primary {
  background: var(--fari-blue, #183e91);
  color: var(--fari-white, #fff);
}
.f-btn--primary:not(:disabled):hover {
  background: var(--fari-web-blue, #2e4fbf);
}
.f-btn--secondary {
  background: transparent;
  color: var(--fari-blue, #183e91);
  border-color: var(--fari-blue, #183e91);
}
.f-btn--secondary:not(:disabled):hover {
  background: rgba(46, 79, 191, 0.08);
}
.f-btn--ghost {
  background: transparent;
  color: var(--fari-blue, #183e91);
}
.f-btn--ghost:not(:disabled):hover {
  background: rgba(46, 79, 191, 0.08);
}
/* Brand gradient (blue → emerald), the signature CTA. */
.f-btn--gradient {
  background-image: linear-gradient(110deg, var(--fari-blue, #183e91), #10b981);
  color: var(--fari-white, #fff);
  border: none;
  box-shadow: 0 8px 20px -8px rgba(24, 62, 145, 0.55);
  transition:
    filter 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}
.f-btn--gradient:not(:disabled):hover {
  filter: brightness(1.06);
  box-shadow: 0 12px 26px -8px rgba(24, 62, 145, 0.6);
  transform: translateY(-1px);
}
.f-btn--gradient:not(:disabled):active {
  transform: translateY(0);
  filter: brightness(0.97);
}

/* spinner */
.f-btn__spinner {
  width: 1em;
  height: 1em;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: f-btn-spin 0.7s linear infinite;
}
@keyframes f-btn-spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
