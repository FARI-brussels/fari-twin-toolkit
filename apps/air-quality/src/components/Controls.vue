<script setup lang="ts">
import { sources } from '../data/sources'
import { norms } from '../data/norms'
import { activeNorm, activeSource, state } from '../state'
</script>

<template>
  <section class="controls">
    <div class="group">
      <div class="label">Measurement source</div>
      <div class="segmented" role="tablist">
        <button
          v-for="s in sources"
          :key="s.id"
          class="seg"
          :class="{ active: s.id === state.sourceId }"
          role="tab"
          :aria-selected="s.id === state.sourceId"
          @click="state.sourceId = s.id"
        >
          {{ s.label }}
        </button>
      </div>
      <p class="blurb">{{ activeSource.blurb }}</p>
    </div>

    <div class="group">
      <div class="label">Reference norm</div>
      <div class="segmented" role="tablist">
        <button
          v-for="n in norms"
          :key="n.id"
          class="seg"
          :class="{ active: n.id === state.normId }"
          role="tab"
          :aria-selected="n.id === state.normId"
          @click="state.normId = n.id"
        >
          {{ n.label }}
        </button>
      </div>
      <p class="blurb">{{ activeNorm.blurb }}</p>
    </div>
  </section>
</template>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.label {
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fari-blue);
  opacity: 0.75;
}
.segmented {
  display: flex;
  gap: 0.25rem;
  background: rgba(24, 62, 145, 0.07);
  border-radius: 0.6rem;
  padding: 0.25rem;
}
.seg {
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--aq-ink);
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-semibold);
  padding: 0.4rem 0.35rem;
  border-radius: 0.45rem;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}
.seg:hover {
  background: rgba(24, 62, 145, 0.1);
}
.seg.active {
  background: var(--fari-blue);
  color: var(--fari-white);
  box-shadow: 0 2px 8px rgba(24, 62, 145, 0.3);
}
.blurb {
  margin: 0;
  font-size: var(--fari-font-size-caption);
  line-height: 1.35;
  color: rgba(10, 18, 48, 0.7);
}
</style>
