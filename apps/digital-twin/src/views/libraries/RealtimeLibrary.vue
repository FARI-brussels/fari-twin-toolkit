<template>
  <LibraryBase
    title="Realtime Data"
    item-type="dataset"
    :viewer-component="RealtimeViewer"
    :code-snippets="codeSnippets"
    :items="[]"
    :is-loading="false"
    :error="null"
    :static-items="realtimeDatasets"
  >
    <template #list-item="{ items, selectedItem, selectItem }">
      <li
        v-for="item in items"
        :key="item.id"
        class="group"
      >
        <button
          class="w-full p-4 rounded-xl transition-all duration-200 text-left"
          :class="[
            selectedItem?.id === item.id
              ? 'bg-gradient-to-r from-violet-500/15 to-violet-500/5 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/50',
          ]"
          @click="selectItem(item)"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
              :class="[
                selectedItem?.id === item.id
                  ? 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/30'
                  : 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800',
              ]"
            >
              <Radio
                class="w-5 h-5 transition-colors duration-200"
                :class="[
                  selectedItem?.id === item.id
                    ? 'text-white'
                    : 'text-slate-500 dark:text-slate-400',
                ]"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p
                class="font-semibold truncate transition-colors duration-200"
                :class="[
                  selectedItem?.id === item.id
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-700 dark:text-slate-200',
                ]"
              >
                {{ item.name }}
              </p>
              <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                {{ item.description }}
              </p>

              <!-- Badges -->
              <div class="flex items-center gap-2 mt-2">
                <FChip variant="neutral" size="sm">{{ (item as any).id }}</FChip>
                <FChip :variant="(item as any).type === 'mobility' ? 'info' : 'success'" size="sm">
                  {{ (item as any).type === 'mobility' ? 'Mobility Twin' : 'Backend' }}
                </FChip>
              </div>
            </div>
          </div>
        </button>
      </li>
    </template>
  </LibraryBase>
</template>

<script setup lang="ts">
import LibraryBase from '@/components/LibraryBase.vue';
import RealtimeViewer from '@/components/RealtimeViewer.vue';
import { FChip } from '@fari-brussels/twin-ui-vue';
import { MobilityEndpoints } from '@/api/mobilityClient';
import { ComponentEndpoints } from '@/api/queries/components';
import { Radio } from 'lucide-vue-next';
import type { RealtimeDataset, LibraryItem } from '@/types';

const mobilityDatasets: RealtimeDataset[] = Object.keys(MobilityEndpoints).map((key) => ({
  id: key,
  name: formatName(key),
  description: `Real-time data for ${formatName(key)}`,
  type: 'mobility',
  endpoint: MobilityEndpoints[key as keyof typeof MobilityEndpoints],
}));

const componentDatasets: RealtimeDataset[] = Object.keys(ComponentEndpoints).map((key) => ({
  id: key,
  name: formatName(key),
  description: `Backend component: ${formatName(key)}`,
  type: 'component',
  endpoint: ComponentEndpoints[key as keyof typeof ComponentEndpoints],
}));

const realtimeDatasets: RealtimeDataset[] = [...mobilityDatasets, ...componentDatasets];

function formatName(key: string): string {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function isMobilitySource(id: string): boolean {
  return id in MobilityEndpoints;
}

const codeSnippets = {
  js: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    if (isMobilitySource(dataset.id)) {
      return `// Fetch ${dataset.name} data from Mobility Twin API
import { fetchMobilityData } from '@/api/mobilityClient';

async function getData() {
  const response = await fetchMobilityData('${dataset.id}');
  console.log(response);
}`;
    }
    return `// Fetch ${dataset.name} data from Backend
import { apiClient, ComponentEndpoints } from '@/api';

async function getData() {
  const endpoint = ComponentEndpoints['${dataset.id}'];
  const response = await apiClient.get(endpoint).json();
  console.log(response);
}`;
  },
  react: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    if (isMobilitySource(dataset.id)) {
      return `// React Hook for ${dataset.name}
import { useState, useEffect } from 'react';
import { fetchMobilityData } from '@/api/mobilityClient';

export function use${dataset.name.replace(/\s/g, '')}() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMobilityData('${dataset.id}').then(setData);
  }, []);

  return data;
}`;
    }
    return `// React Hook for ${dataset.name}
import { useState, useEffect } from 'react';
import { apiClient, ComponentEndpoints } from '@/api';

export function use${dataset.name.replace(/\s/g, '')}() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const endpoint = ComponentEndpoints['${dataset.id}'];
    apiClient.get(endpoint).json().then(setData);
  }, []);

  return data;
}`;
  },
  unity: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    if (isMobilitySource(dataset.id)) {
      return `// Unity C# Example - Mobility Twin API
// Endpoint: https://api.mobilitytwin.brussels${dataset.endpoint}

// Ensure you add the Authorization header
// with your Mobility Twin token`;
    }
    return `// Unity C# Example - Backend API
// Endpoint: {BACKEND_URL}/${dataset.endpoint}

// Ensure you add the Authorization header
// with your Keycloak token`;
  },
};
</script>