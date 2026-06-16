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
        v-if="!ready || tilesetLoading"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 z-20"
      >
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Loader2 class="h-6 w-6 text-emerald-500 animate-spin" />
          </div>
          <p class="text-slate-700 font-medium">Loading tileset...</p>
          <p class="text-slate-500 text-sm mt-1">This may take a moment</p>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-300"
      leave-to-class="opacity-0"
    >
      <div
        v-if="tilesetError && !tilesetLoading"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 z-30"
      >
        <div class="text-center max-w-sm px-6">
          <div class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle class="h-8 w-8 text-red-500" />
          </div>
          <p class="text-red-700 font-semibold mb-2">Failed to load tileset</p>
          <p class="text-red-600/70 text-sm">{{ tilesetError }}</p>
          <button
            class="mt-4 px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium transition-colors"
            @click="retryLoad"
          >
            Try Again
          </button>
        </div>
      </div>
    </Transition>

    <div class="absolute top-4 right-4 z-10 pointer-events-auto">
      <div
        class="flex items-center px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/50 text-slate-700 [--fari-checkbox-accent:#10b981]"
      >
        <FCheckbox v-model="showWmsLayer">
          <span class="flex items-center gap-2 font-medium">
            <Map class="w-4 h-4 text-slate-500" />
            UrbIS Base Map
          </span>
        </FCheckbox>
      </div>
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
      @reset="handleReset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useViewer, useLayers, useLayerStatus, useCameraControls } from '@fari-brussels/viewer-vue';
import { CesiumAdapter } from '@fari-brussels/viewer-cesium';
import type { LayerSpec } from '@fari-brussels/viewer-core';
import { ViewerControls } from '@/components/ui/viewer-controls';
import { FCheckbox } from '@fari-brussels/twin-ui-vue';
import { Loader2, AlertCircle, Map } from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';
import {
  buildTilesetSpec,
  URBIS_WMS_SPEC,
  TILESET_LAYER_ID,
  TILESET_FRAME_OPTIONS,
} from '@/lib/tileset';

const props = defineProps<{ tilesetUrl: string }>();

const wrapperRef = ref<HTMLDivElement | null>(null);
const { getToken } = useAuth();

// Renderer-agnostic viewer with Brussels custom terrain (Ion). A missing Ion
// token degrades gracefully to the flat ellipsoid (handled in the adapter).
const { containerRef, viewer, ready } = useViewer(
  () =>
    new CesiumAdapter({
      terrain: { ionAssetId: 3340034 },
      ionToken: import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN,
    }),
  {
    basemap: { kind: 'osm' },
    initialCamera: { center: { lon: 4.36, lat: 50.7 }, height: 10000, heading: 0, pitch: -32 },
  }
);

const showWmsLayer = ref(true);
const retrying = ref(false);

// Declarative layer set: the UrbIS WMS overlay (toggle) + the tileset. Dropping
// the tileset for a tick (`retrying`) forces a fresh load on retry.
const layers = computed<LayerSpec[]>(() => {
  const list: LayerSpec[] = [];
  if (showWmsLayer.value) list.push(URBIS_WMS_SPEC);
  if (props.tilesetUrl && !retrying.value) list.push(buildTilesetSpec(props.tilesetUrl, getToken));
  return list;
});

useLayers(viewer, ready, () => layers.value);

const { loading: tilesetLoading, error: tilesetError } = useLayerStatus(viewer, TILESET_LAYER_ID);

const { zoomIn, zoomOut, rotateLeft, rotateRight, resetView, configureControls } =
  useCameraControls(viewer);

watch(
  ready,
  (isReady) => {
    if (isReady)
      configureControls({ enableRotate: true, enableZoom: true, enableTilt: true, enableLook: true });
  },
  { immediate: true }
);

async function retryLoad() {
  retrying.value = true;
  await nextTick();
  retrying.value = false;
}

function handleReset() {
  if (props.tilesetUrl) viewer.value?.frameLayer(TILESET_LAYER_ID, TILESET_FRAME_OPTIONS);
  else resetView();
}
</script>