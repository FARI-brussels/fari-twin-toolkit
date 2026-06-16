<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { MapLibreAdapter } from '@fari-brussels/viewer-maplibre'
import type { FeatureCollection } from '@fari-brussels/twin-types'
import 'maplibre-gl/dist/maplibre-gl.css'

// The *same* inline dataset the Cesium demo uses — the point of this tab is that
// one LayerSpec renders on a different renderer with zero app changes.
const demo: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Pentagon (city centre)' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [4.34, 50.84],
            [4.37, 50.84],
            [4.37, 50.86],
            [4.34, 50.86],
            [4.34, 50.84],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Grand-Place' },
      geometry: { type: 'Point', coordinates: [4.3525, 50.8467] },
    },
  ],
}

const container = ref<HTMLDivElement | null>(null)
const adapter = shallowRef<MapLibreAdapter | null>(null)
const status = ref('mounting…')
const lastClick = ref('—')

onMounted(async () => {
  if (!container.value) return
  const a = new MapLibreAdapter()
  adapter.value = a
  await a.mount(container.value, {
    basemap: { kind: 'osm' },
    initialCamera: { center: { lon: 4.3517, lat: 50.8503 } },
  })
  a.addLayer({
    id: 'demo',
    kind: 'geojson',
    data: demo,
    style: { fillColor: '#64D8BF', strokeColor: '#183E91', strokeWidth: 2 },
  })
  a.on('click', (pick) => {
    lastClick.value = pick.position
      ? `${pick.position.lon.toFixed(4)}, ${pick.position.lat.toFixed(4)}`
      : '(no surface)'
  })
  status.value = 'ready — one MapLibreAdapter, driven only by @fari-brussels/viewer-core'
})

onBeforeUnmount(() => {
  adapter.value?.destroy()
  adapter.value = null
})
</script>

<template>
  <div class="map-demo">
    <div ref="container" class="map-canvas" />
    <p class="hint">
      <span class="dot" /> {{ status }} · click the map → <code>{{ lastClick }}</code>
    </p>
  </div>
</template>

<style scoped>
.map-demo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.map-canvas {
  width: 100%;
  height: 70vh;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--fari-web-blue);
}
.hint {
  font-size: var(--fari-font-size-body-sm);
  color: var(--fari-black);
}
.dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--fari-lighthouse);
  margin-right: 0.35rem;
  vertical-align: middle;
}
code {
  background: #f3f3f3;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
}
</style>
