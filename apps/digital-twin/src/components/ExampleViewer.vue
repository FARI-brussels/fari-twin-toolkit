<!-- components/ExampleViewer.vue -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="example" 
        class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out delay-75"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div 
            ref="wrapperRef"
            class="relative w-[92vw] h-[90vh] rounded-3xl overflow-hidden bg-slate-100 shadow-2xl shadow-slate-400/30 border border-white"
          >
            <div ref="containerRef" class="absolute inset-0" />

            <!-- Loading Overlay -->
            <Transition
              enter-active-class="transition-opacity duration-300"
              enter-from-class="opacity-0"
              leave-active-class="transition-opacity duration-300"
              leave-to-class="opacity-0"
            >
              <div 
                v-if="loading || !ready"
                class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 z-10"
              >
                <div class="text-center">
                  <div class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
                    <Loader2 class="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <p class="text-slate-700 font-semibold">Loading experience...</p>
                  <p class="text-slate-500 text-sm mt-1">Preparing 3D environment</p>
                </div>
              </div>
            </Transition>

            <!-- Top Bar -->
            <div class="absolute top-0 left-0 right-0 z-20 p-4 flex items-start justify-between pointer-events-none">
              <!-- Info Panel -->
              <div class="pointer-events-auto max-w-md">
                <div class="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl shadow-slate-200/50">
                  <div class="flex items-start gap-4 mb-4">
                    <div 
                      class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                      :class="example.theme?.gradient || 'bg-gradient-to-br from-primary to-primary/70'"
                    >
                      <component :is="example.theme?.icon || Globe" class="w-6 h-6 text-white" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h2 class="text-xl font-bold text-slate-800 mb-1">{{ example.name }}</h2>
                      <p class="text-sm text-slate-500 line-clamp-2">{{ example.description }}</p>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <button
                      class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors"
                      :class="showLayers ? 'bg-slate-100' : 'hover:bg-slate-50'"
                      @click="showLayers = !showLayers"
                    >
                      <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Active Layers
                      </span>
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {{ activeLayers.length }}
                        </span>
                        <ChevronDown 
                          class="w-4 h-4 text-slate-400 transition-transform duration-200"
                          :class="showLayers ? 'rotate-180' : ''"
                        />
                      </div>
                    </button>

                    <Transition
                      enter-active-class="transition-all duration-200 ease-out"
                      enter-from-class="opacity-0 -translate-y-2"
                      enter-to-class="opacity-100 translate-y-0"
                      leave-active-class="transition-all duration-150 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <div v-if="showLayers" class="space-y-1.5 mt-2">
                        <div
                          v-for="layer in activeLayers"
                          :key="layer.id"
                          class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div 
                            class="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                            :class="getLayerIconBg(layer.type)"
                          >
                            <component :is="getLayerIcon(layer.type)" class="w-4 h-4 text-white" />
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-700 truncate">{{ layer.name }}</p>
                            <p class="text-xs text-slate-400 uppercase">{{ layer.type }}</p>
                          </div>
                          <div 
                            class="w-2 h-2 rounded-full shadow-sm"
                            :class="loadedLayers.has(layer.id) ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'"
                          />
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>

              <!-- Close Button -->
              <button
                class="pointer-events-auto w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/50 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all duration-200 hover:scale-105 shadow-xl shadow-slate-200/50"
                @click="handleClose"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Error Toast -->
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 translate-y-4"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0 translate-y-4"
            >
              <div 
                v-if="loadError"
                class="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 backdrop-blur-xl border border-red-200 shadow-lg"
              >
                <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
                <p class="text-sm text-red-700 font-medium">{{ loadError }}</p>
                <button 
                  class="text-red-400 hover:text-red-600 transition-colors"
                  @click="loadError = null"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </Transition>

            <!-- Viewer Controls -->
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
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useViewer, useLayers, useCameraControls } from '@fari-brussels/viewer-vue';
import { CesiumAdapter } from '@fari-brussels/viewer-cesium';
import type { LayerSpec } from '@fari-brussels/viewer-core';
import { ViewerControls } from '@/components/ui/viewer-controls';
import type { DemoExample, ExampleLayer } from '@/types';
import { X, ChevronDown, Loader2, Globe, Layers, Map, Box, AlertCircle } from 'lucide-vue-next';

const props = defineProps<{ example: DemoExample }>();
const emit = defineEmits<{ close: [] }>();

const wrapperRef = ref<HTMLDivElement | null>(null);
const loadError = ref<string | null>(null);
const showLayers = ref(true);

const { containerRef, viewer, ready } = useViewer(
  () =>
    new CesiumAdapter({
      terrain: { ionAssetId: 3340034 },
      ionToken: import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN,
    }),
  {
    basemap: { kind: 'osm' },
    initialCamera: { center: { lon: 4.36, lat: 50.7 }, height: 12000, heading: 0, pitch: -40 },
  }
);

const activeLayers = computed<ExampleLayer[]>(() =>
  props.example.layers.filter((l) => l.enabled)
);

// Map example layers → toolkit specs (basemap is handled by the viewer itself).
// The first tileset gets framed.
const layers = computed<LayerSpec[]>(() => {
  const specs: LayerSpec[] = [];
  let firstTileset = true;
  for (const l of activeLayers.value) {
    if (l.type === 'wms' && l.url && l.layer) {
      specs.push({ id: l.id, kind: 'wms', url: l.url, layers: [l.layer], opacity: 0.9 });
    } else if (l.type === 'tileset' && l.url) {
      specs.push({
        id: l.id,
        kind: 'tileset3d',
        url: l.url,
        maximumScreenSpaceError: 6,
        ...(firstTileset ? { frame: { heading: 240, pitch: -25, distanceMultiplier: 1.8 } } : {}),
      });
      firstTileset = false;
    }
  }
  return specs;
});

useLayers(viewer, ready, () => layers.value);

// Aggregate async load status from the renderer's layerStatus events.
const loadingCount = ref(0);
const loadedTilesets = ref<Set<string>>(new Set());

watch(
  () => viewer.value,
  (v) => {
    if (!v) return;
    v.on('layerStatus', (e) => {
      if (e.status === 'loading') loadingCount.value++;
      else loadingCount.value = Math.max(0, loadingCount.value - 1);
      if (e.status === 'loaded') loadedTilesets.value = new Set(loadedTilesets.value).add(e.id);
      else if (e.status === 'error') loadError.value = e.error ?? 'Failed to load a layer';
    });
  },
  { immediate: true }
);

const loading = computed(() => loadingCount.value > 0);

// WMS/basemap load synchronously; tilesets report "loaded" via layerStatus.
const loadedLayers = computed(() => {
  const set = new Set<string>();
  if (!ready.value) return set;
  for (const l of activeLayers.value) {
    if (l.type === 'tileset') {
      if (loadedTilesets.value.has(l.id)) set.add(l.id);
    } else {
      set.add(l.id);
    }
  }
  return set;
});

const { zoomIn, zoomOut, rotateLeft, rotateRight, resetView, configureControls } =
  useCameraControls(viewer);

watch(
  ready,
  (isReady) => {
    if (isReady)
      configureControls({
        enableRotate: true,
        enableZoom: true,
        enableTilt: true,
        enableLook: true,
      });
  },
  { immediate: true }
);

function getLayerIcon(type: string) {
  switch (type) {
    case 'tileset':
      return Box;
    case 'wms':
      return Map;
    case 'basemap':
      return Globe;
    default:
      return Layers;
  }
}

function getLayerIconBg(type: string): string {
  switch (type) {
    case 'tileset':
      return 'bg-gradient-to-br from-emerald-500 to-teal-600';
    case 'wms':
      return 'bg-gradient-to-br from-blue-500 to-cyan-600';
    case 'basemap':
      return 'bg-gradient-to-br from-slate-400 to-slate-500';
    default:
      return 'bg-gradient-to-br from-violet-500 to-purple-600';
  }
}

function handleClose() {
  emit('close');
}
</script>