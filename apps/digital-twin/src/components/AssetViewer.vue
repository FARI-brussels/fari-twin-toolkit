<template>
  <div ref="wrapperRef" class="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
    <div ref="containerRef" class="w-full h-full" />

    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-300"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading || !ready"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 z-20"
      >
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Loader2 class="h-6 w-6 text-amber-500 animate-spin" />
          </div>
          <p class="text-slate-700 font-medium">Loading asset...</p>
        </div>
      </div>
    </Transition>

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
import { ref, computed, watch } from 'vue';
import { useViewer, useLayer, useLayerStatus, useCameraControls } from '@fari-brussels/viewer-vue';
import { CesiumAdapter } from '@fari-brussels/viewer-cesium';
import type { FrameOptions, Mesh3dLayerSpec } from '@fari-brussels/viewer-core';
import { ViewerControls } from '@/components/ui/viewer-controls';
import { Loader2 } from 'lucide-vue-next';

const {
  assetUrl,
  position = [4.3517, 50.8503, 0],
  scale = 3,
  rotation = [0, 0, 0],
  cameraDistance = 80,
  cameraPitch = -30,
} = defineProps<{
  assetUrl: string;
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  cameraDistance?: number;
  cameraPitch?: number;
}>();

const ASSET_ID = 'asset';
const wrapperRef = ref<HTMLDivElement | null>(null);

// Renderer-agnostic viewer; no direct Cesium in this component.
const { containerRef, viewer, ready } = useViewer(() => new CesiumAdapter(), {
  basemap: { kind: 'osm' },
  initialCamera: {
    center: { lon: position[0], lat: position[1] },
    height: cameraDistance,
    heading: 45,
    pitch: cameraPitch,
  },
});

// Frame the placed model: absolute distance, matching the old lookAtModel.
const frameOptions = computed<FrameOptions>(() => ({
  heading: 0,
  pitch: cameraPitch,
  distance: cameraDistance || scale * 25,
}));

// One mesh layer, described declaratively. Changing any transform prop updates
// the spec, which the toolkit reconciles (re-placing/re-framing the model).
const meshSpec = computed<Mesh3dLayerSpec | null>(() => {
  if (!assetUrl || !assetUrl.startsWith('http')) return null;
  return {
    id: ASSET_ID,
    kind: 'mesh3d',
    url: assetUrl,
    position: { lon: position[0], lat: position[1], height: position[2] },
    scale,
    // DT rotation is [roll, pitch, heading] in degrees.
    orientation: { roll: rotation[0], pitch: rotation[1], heading: rotation[2] },
    minimumPixelSize: 64,
    maximumScale: 20000,
    frame: frameOptions.value,
  };
});

useLayer(viewer, ready, () => meshSpec.value);

const { loading: modelLoading } = useLayerStatus(viewer, ASSET_ID);
const isLoading = computed(() => !ready.value || modelLoading.value);

const { zoomIn, zoomOut, rotateLeft, rotateRight, configureControls } = useCameraControls(viewer);

watch(
  ready,
  (isReady) => {
    if (isReady)
      configureControls({ enableRotate: true, enableZoom: true, enableTilt: true, enableLook: true });
  },
  { immediate: true }
);

function handleReset() {
  viewer.value?.frameLayer(ASSET_ID, frameOptions.value);
}
</script>