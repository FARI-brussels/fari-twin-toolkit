<template>
  <div class="absolute inset-0 pointer-events-none z-10">
    <div v-if="showClose" class="absolute top-4 right-4 pointer-events-auto">
      <button
        class="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all duration-200 hover:scale-105 shadow-lg shadow-slate-200/50"
        @click="emit('close')"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="absolute bottom-0 left-0 right-0 p-4">
      <div class="flex items-end justify-between">
        <div class="pointer-events-auto flex gap-2">
          <div class="flex flex-col gap-1">
            <button
              class="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors shadow-lg shadow-slate-200/50"
              title="Zoom in"
              @click="emit('zoomIn')"
            >
              <Plus class="w-4 h-4" />
            </button>
            <button
              class="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors shadow-lg shadow-slate-200/50"
              title="Zoom out"
              @click="emit('zoomOut')"
            >
              <Minus class="w-4 h-4" />
            </button>
          </div>

          <div v-if="showRotation" class="flex flex-col gap-1">
            <button
              class="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors shadow-lg shadow-slate-200/50"
              title="Rotate left (or use middle mouse / two-finger drag)"
              @click="emit('rotateLeft')"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
            <button
              class="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors shadow-lg shadow-slate-200/50"
              title="Rotate right (or use middle mouse / two-finger drag)"
              @click="emit('rotateRight')"
            >
              <RotateCw class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200/30 text-slate-500 text-xs">
          <MousePointer2 class="w-3.5 h-3.5" />
          <span>Drag to pan • Scroll to zoom • Right-click to rotate</span>
        </div>

        <div class="pointer-events-auto flex items-center gap-2">
          <button
            v-if="showReset"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 text-slate-700 text-sm font-medium hover:bg-white hover:text-slate-900 transition-colors shadow-lg shadow-slate-200/50"
            @click="emit('reset')"
          >
            <Home class="w-4 h-4" />
            <span class="hidden sm:inline">Reset</span>
          </button>
          <button
            v-if="showFullscreen"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-medium hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            @click="toggleFullscreen"
          >
            <Maximize2 v-if="!isFullscreen" class="w-4 h-4" />
            <Minimize2 v-else class="w-4 h-4" />
            <span class="hidden sm:inline">{{ isFullscreen ? 'Exit' : 'Fullscreen' }}</span>
          </button>
        </div>
      </div>
    </div>

    <template v-if="showCorners">
      <div class="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-slate-300/50 rounded-tl-lg" />
      <div class="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-slate-300/50 rounded-tr-lg" />
      <div class="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-slate-300/50 rounded-bl-lg" />
      <div class="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-slate-300/50 rounded-br-lg" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  X,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Home,
  Maximize2,
  Minimize2,
  MousePointer2,
} from 'lucide-vue-next';

interface Props {
  showClose?: boolean;
  showReset?: boolean;
  showFullscreen?: boolean;
  showRotation?: boolean;
  showCorners?: boolean;
  fullscreenTarget?: HTMLElement | null;
}

const props = withDefaults(defineProps<Props>(), {
  showClose: false,
  showReset: true,
  showFullscreen: true,
  showRotation: true,
  showCorners: false,
});

const emit = defineEmits<{
  close: [];
  reset: [];
  zoomIn: [];
  zoomOut: [];
  rotateLeft: [];
  rotateRight: [];
  fullscreenChange: [isFullscreen: boolean];
}>();

const isFullscreen = ref(false);

function toggleFullscreen() {
  const target = props.fullscreenTarget || document.documentElement;

  if (!document.fullscreenElement) {
    target.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  emit('fullscreenChange', isFullscreen.value);
}

onMounted(() =>
  document.addEventListener('fullscreenchange', handleFullscreenChange));

onUnmounted(() => 
  document.removeEventListener('fullscreenchange', handleFullscreenChange));
</script>