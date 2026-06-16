<template>
  <Transition
    name="overlay"
    mode="out-in"
  >
    <div
      v-if="show"
      :class="overlayClasses"
    >
      <div class="viewer-overlay__content">
        <Loader2 v-if="!error" class="viewer-overlay__spinner" />
        <AlertCircle v-else class="viewer-overlay__icon--error" />
        
        <div class="viewer-overlay__text">
          <p class="viewer-overlay__message">{{ message }}</p>
          <p v-if="description" class="viewer-overlay__description">{{ description }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2, AlertCircle } from 'lucide-vue-next'

type OverlayVariant = 'loading' | 'error' | 'warning'

const props = withDefaults(
  defineProps<{
    show?: boolean
    message?: string
    description?: string
    variant?: OverlayVariant
    blur?: boolean
    zIndex?: number
  }>(),
  {
    show: false,
    message: 'Loading...',
    variant: 'loading',
    blur: true,
    zIndex: 40,
  }
)

const error = computed(() => props.variant === 'error')

const overlayClasses = computed(() => [
  'viewer-overlay',
  `viewer-overlay--${props.variant}`,
  {
    'viewer-overlay--blur': props.blur,
  }
])
</script>

<style scoped lang="scss">
.viewer-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: v-bind(zIndex);
  
  &--loading {
    background: rgb(17 24 39 / 90%);
  }
  
  &--error {
    background: rgb(127 29 29 / 80%);
  }
  
  &--warning {
    background: rgb(113 63 18 / 80%);
  }
  
  &--blur {
    backdrop-filter: blur(8px);
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: rgb(0 0 0 / 60%);
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 20%);
  }

  &__spinner {
    width: 1.5rem;
    height: 1.5rem;
    color: #fff;
    flex-shrink: 0;
    animation: spin 1s linear infinite;
  }

  &__icon--error {
    width: 1.5rem;
    height: 1.5rem;
    color: #fca5a5;
    flex-shrink: 0;
  }

  &__text {
    color: #fff;
  }

  &__message {
    font-size: 0.9375rem;
    font-weight: 500;
    line-height: 1.4;
  }

  &__description {
    margin-top: 0.375rem;
    font-size: 0.8125rem;
    opacity: 0.8;
    line-height: 1.4;
  }
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>