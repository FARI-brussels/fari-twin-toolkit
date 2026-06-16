<template>
  <div class="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
    <div class="max-w-6xl mx-auto p-8">
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400 text-sm font-medium mb-4">
          <Sparkles class="w-4 h-4" />
          Interactive Examples
        </div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent mb-3">
          Demo Gallery
        </h1>
        <p class="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Explore different combinations of 3D tilesets and map layers to see what's possible
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
          v-for="example in examplesWithEnabledLayers"
          :key="example.id"
          class="group text-left bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
          :class="[`hover:border-${example.theme.borderColor}/30`]"
          @click="openExample(example)"
        >
          <div 
            class="h-48 flex items-center justify-center relative overflow-hidden"
            :class="example.theme.gradient"
          >
            <div class="absolute inset-0 opacity-30">
              <div class="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/20 blur-2xl"></div>
              <div class="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-white/20 blur-xl"></div>
            </div>
            
            <div class="relative">
              <div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/20">
                <component :is="example.theme.icon" class="w-10 h-10 text-white" />
              </div>
            </div>

            <div class="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-lg">
              {{ example.enabledLayers.length }} layers
            </div>
          </div>

          <div class="p-6">
            <h3 
              class="text-xl font-bold text-slate-800 dark:text-white mb-2 transition-colors duration-200"
              :class="[`group-hover:${example.theme.textColor}`]"
            >
              {{ example.name }}
            </h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">
              {{ example.description }}
            </p>

            <div class="flex flex-wrap gap-2 mb-5">
              <span
                v-for="layer in example.enabledLayers.slice(0, 4)"
                :key="layer.id"
                class="px-2.5 py-1 rounded-lg text-xs font-medium"
                :class="getLayerClasses(layer)"
              >
                {{ layer.name }}
              </span>
              <span
                v-if="example.enabledLayers.length > 4"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                +{{ example.enabledLayers.length - 4 }} more
              </span>
            </div>

            <div 
              class="flex items-center gap-2 font-semibold text-sm transition-all duration-200 group-hover:gap-3"
              :class="example.theme.textColor"
            >
              <span>Explore Example</span>
              <ArrowRight class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>
    </div>

    <ExampleViewer v-if="selectedExample" :example="selectedExample" @close="closeExample" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ExampleViewer from '@/components/ExampleViewer.vue';
import { Building2, TreePine, Wind, Sparkles, ArrowRight } from 'lucide-vue-next';
import type { DemoExample, ExampleLayer } from '@/types';

interface ThemedExample extends DemoExample {
  theme: {
    gradient: string;
    icon: typeof Building2;
    textColor: string;
    borderColor: string;
  };
}

const selectedExample = ref<DemoExample | null>(null);

const examples = ref<ThemedExample[]>([
  {
    id: 'complete-city',
    name: 'Complete Smart City',
    description:
      'A comprehensive view of the smart city including buildings, urban infrastructure, and environmental assets with interactive building information.',
    theme: {
      gradient: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500',
      icon: Building2,
      textColor: 'text-violet-500 dark:text-violet-400',
      borderColor: 'violet-500',
    },
    layers: [
      { id: 'basemap', name: 'Base Map', type: 'basemap', enabled: true, url: '' },
      { id: 'buildings', name: 'Buildings', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-30-52/tileset.json', enabled: true },
      { id: 'trees', name: 'Trees', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-24-12/tiles/tileset.json', enabled: true },
      { id: 'chirec', name: 'Hospital', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-20-46/tileset.json', enabled: true },
      { id: 'josephine', name: 'Metro', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-20-16/tileset.json', enabled: true },
      { id: 'lampposts', name: 'Lampposts', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-42-25/tiles/tileset.json', enabled: true },
      { id: 'usquare', name: 'Usquare', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-15-03/tileset.json', enabled: true },
    ],
  },
  {
    id: 'urban-heat-island',
    name: 'Urban Heat Island',
    description:
      'Explore the urban heat island of Brussels including buildings, trees, and the Green Walk route with detailed 3D vegetation.',
    theme: {
      gradient: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500',
      icon: TreePine,
      textColor: 'text-emerald-500 dark:text-emerald-400',
      borderColor: 'emerald-500',
    },
    layers: [
      { id: 'basemap', name: 'Base Map', type: 'basemap', enabled: true, url: '' },
      { id: 'buildings', name: 'Buildings', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-30-52/tileset.json', enabled: true },
      { id: 'trees', name: 'Trees', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-24-12/tiles/tileset.json', enabled: true },
      { id: 'trees_jette', name: 'Jette Trees', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-27-59/tiles/tileset.json', enabled: true },
      { id: 'heat-island', name: 'Heat Island', type: 'wms', url: 'https://ows.environnement.brussels/air?', layer: 'urban_heat_islands', enabled: true },
    ],
  },
  {
    id: 'environmental-monitoring',
    name: 'Environmental Monitoring',
    description:
      'View environmental monitoring infrastructure including air quality stations and sensors overlaid on the urban landscape.',
    theme: {
      gradient: 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500',
      icon: Wind,
      textColor: 'text-sky-500 dark:text-sky-400',
      borderColor: 'sky-500',
    },
    layers: [
      { id: 'basemap', name: 'Base Map', type: 'basemap', enabled: true, url: '' },
      { id: 'buildings', name: 'Buildings', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-30-52/tileset.json', enabled: true },
      { id: 'trees', name: 'Trees', type: 'tileset', url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-24-12/tiles/tileset.json', enabled: true },
      { id: 'air-quality', name: 'Air Quality', type: 'wms', url: 'https://wms.environnement.brussels/be_wms', layer: 'bruenvi_air_monitoring_stations', enabled: true },
    ],
  },
]);

const examplesWithEnabledLayers = computed(() => {
  return examples.value.map(example => ({
    ...example,
    enabledLayers: example.layers.filter(l => l.enabled),
  }));
});

function openExample(example: DemoExample): void {
  selectedExample.value = example;
}

function closeExample(): void {
  selectedExample.value = null;
}

function getLayerClasses(layer: ExampleLayer): string {
  switch (layer.type) {
    case 'basemap':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    case 'tileset':
      return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300';
    case 'wms':
      return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  }
}
</script>