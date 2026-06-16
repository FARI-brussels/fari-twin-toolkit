<template>
  <div ref="wrapperRef" class="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
    <div ref="containerRef" class="absolute inset-0" />

    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-300"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!ready"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 z-20"
      >
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Loader2 class="h-6 w-6 text-blue-500 animate-spin" />
          </div>
          <p class="text-slate-700 font-medium">Loading map layer...</p>
        </div>
      </div>
    </Transition>

    <div class="absolute bottom-20 right-4 z-10 pointer-events-auto">
      <MapLegend
        :image-src="legendUrl"
        :show-icon="true"
      />
    </div>

    <ViewerControls
      :show-rotation="true"
      :show-reset="true"
      :show-fullscreen="true"
      :show-corners="true"
      :fullscreen-target="wrapperRef"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @rotate-left="() => rotateLeft(30)"
      @rotate-right="() => rotateRight(30)"
      @reset="resetView"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useViewer, useLayers, useCameraControls } from '@fari-brussels/viewer-vue';
import { CesiumAdapter } from '@fari-brussels/viewer-cesium';
import type { LayerSpec } from '@fari-brussels/viewer-core';
import { ViewerControls } from '@/components/ui/viewer-controls';
import { MapLegend } from '@/components/ui/map-legend';
import { Loader2 } from 'lucide-vue-next';
import type { MapLayer } from '@/types';

const props = defineProps<{ mapLayer: MapLayer | null }>();

const wrapperRef = ref<HTMLDivElement | null>(null);

// Renderer-agnostic viewer: the component never imports Cesium directly. The
// CesiumAdapter is the only renderer-specific reference, passed as a factory.
const { containerRef, viewer, ready } = useViewer(() => new CesiumAdapter(), {
  basemap: { kind: 'osm' },
  initialCamera: {
    center: { lon: 4.3517, lat: 50.8503 },
    height: 4000,
    heading: 0,
    pitch: -45,
  },
});

// The active WMS layer, described declaratively. A stable id means swapping the
// selected layer reconciles in place (the adapter rebuilds it); a null mapLayer
// yields an empty list, so the layer is removed.
const layers = computed<LayerSpec[]>(() => {
  const l = props.mapLayer;
  if (!l?.url || !l.layer) return [];
  return [
    {
      id: 'wms-layer',
      kind: 'wms',
      url: l.url,
      layers: [l.layer],
      opacity: 0.9,
      parameters: { transparent: 'true', format: 'image/png' },
    },
  ];
});

useLayers(viewer, ready, () => layers.value);

const { zoomIn, zoomOut, rotateLeft, rotateRight, resetView, configureControls } =
  useCameraControls(viewer);

watch(
  ready,
  (isReady) => {
    if (isReady) {
      configureControls({
        enableRotate: true,
        enableZoom: true,
        enableTilt: true,
        enableLook: true,
      });
    }
  },
  { immediate: true }
);

const legendUrl = computed(() => {
  const l = props.mapLayer;
  if (!l?.url || !l.layer) return '';
  const base = l.url.split('?')[0];
  const layerHash = encodeURIComponent(l.layer).replace(/%/g, '');
  return `${base}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${encodeURIComponent(l.layer)}&v=${layerHash}`;
});
</script>
