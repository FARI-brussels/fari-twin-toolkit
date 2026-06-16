<script setup lang="ts">
import { ref } from 'vue'
import TokensView from './TokensView.vue'
import ComponentsView from './ComponentsView.vue'
import MapDemo from './MapDemo.vue'
import MapLibreDemo from './MapLibreDemo.vue'

type Tab = 'tokens' | 'components' | 'map' | 'maplibre'
const tab = ref<Tab>('tokens')
</script>

<template>
  <main>
    <header>
      <h1>FARI Twin Toolkit</h1>
      <p>Playground · live components &amp; viewers with HMR</p>
      <nav>
        <button :class="{ active: tab === 'tokens' }" @click="tab = 'tokens'">Design tokens</button>
        <button :class="{ active: tab === 'components' }" @click="tab = 'components'">
          Components
        </button>
        <button :class="{ active: tab === 'map' }" @click="tab = 'map'">Map (Cesium)</button>
        <button :class="{ active: tab === 'maplibre' }" @click="tab = 'maplibre'">
          Map (MapLibre)
        </button>
      </nav>
    </header>

    <TokensView v-if="tab === 'tokens'" />
    <ComponentsView v-else-if="tab === 'components'" />
    <!-- key forces a fresh mount/unmount so each renderer is only alive on its tab -->
    <MapDemo v-else-if="tab === 'map'" key="map" />
    <MapLibreDemo v-else key="maplibre" />
  </main>
</template>

<style scoped>
main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}
header h1 {
  font-size: var(--fari-font-size-display);
  color: var(--fari-blue);
  margin-bottom: 0.25rem;
}
header p {
  color: var(--fari-black);
  opacity: 0.7;
}
nav {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0 1.5rem;
}
nav button {
  font: inherit;
  font-size: var(--fari-font-size-body-sm);
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--fari-web-blue);
  border-radius: 2rem;
  background: transparent;
  color: var(--fari-web-blue);
  cursor: pointer;
}
nav button.active {
  background: var(--fari-blue);
  color: var(--fari-white);
  border-color: var(--fari-blue);
}
</style>
