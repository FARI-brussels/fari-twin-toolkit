<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { TwinViewer } from '@fari-brussels/viewer-vue'
import { MapLibreAdapter } from '@fari-brussels/viewer-maplibre'
import type { LayerSpec, PickResult } from '@fari-brussels/viewer-core'
import { loadSource, type LoadedSource } from '../data/load'
import { loadBoundary, type Boundary } from '../data/boundary'
import { activeNorm, activeSource, state } from '../state'

const loaded = ref<LoadedSource | null>(null)
const boundary = ref<Boundary | null>(null)

void loadBoundary().then((b) => (boundary.value = b))

// Re-fetch when the source changes; the loader caches so flipping back is instant.
watch(
  () => state.sourceId,
  async () => {
    state.loading = true
    state.selected = null
    const result = await loadSource(activeSource.value)
    loaded.value = result
    state.stats = { count: result.count, min: result.min, max: result.max }
    state.loading = false
  },
  { immediate: true },
)

/**
 * Three layers with **stable ids** so `useLayers` routes every change through
 * `updateLayer` (not remove+add). On MapLibre that means `setData` /
 * `setPaintProperty` in place — so switching the norm recolours every point in a
 * single animated GPU transition, and switching the source cross-fades the set.
 */
const layers = computed<LayerSpec[]>(() => {
  const out: LayerSpec[] = []
  if (boundary.value) {
    out.push({
      id: 'mask',
      kind: 'geojson',
      data: boundary.value.mask,
      style: { fillColor: '#0a1230', fillOpacity: 0.55 },
    })
    out.push({
      id: 'boundary',
      kind: 'geojson',
      data: boundary.value.outline,
      style: { fillOpacity: 0, strokeColor: '#64D8BF', strokeWidth: 2 },
    })
  }
  if (loaded.value) {
    out.push({
      id: 'measurements',
      kind: 'geojson',
      data: loaded.value.collection,
      style: {
        pointRadius: activeSource.value.pointRadius,
        strokeColor: '#ffffff',
        strokeWidth: 0.6,
        fillOpacity: 0.9,
        colorBy: { property: 'value', mode: 'step', stops: activeNorm.value.stops },
      },
    })
  }
  return out
})

// Frame the region once both the viewer and the boundary are ready. We hold the
// adapter the factory makes so we can fly imperatively — `flyTo` before the map
// loads is a safe no-op, and the 'ready' event covers the boundary-loads-first
// race; the watcher covers boundary-loads-after-ready.
let adapter: MapLibreAdapter | null = null
function frame() {
  if (adapter && boundary.value) {
    void adapter.flyTo({ bbox: boundary.value.bbox }, { durationMs: 800 })
  }
}
function makeAdapter(): MapLibreAdapter {
  adapter = new MapLibreAdapter()
  adapter.on('ready', frame)
  return adapter
}
watch(boundary, frame)

function onPick(pick: PickResult) {
  if (pick.layerId === 'measurements' && pick.properties) {
    state.selected = {
      value: Number(pick.properties.value),
      properties: pick.properties,
      lon: pick.position?.lon,
      lat: pick.position?.lat,
    }
  } else {
    state.selected = null
  }
}
</script>

<template>
  <TwinViewer
    :adapter="makeAdapter"
    :layers="layers"
    :basemap="{ kind: 'xyz', url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png' }"
    class="map"
    @pick="onPick"
  />
</template>

<style scoped>
.map {
  position: absolute;
  inset: 0;
}
</style>
