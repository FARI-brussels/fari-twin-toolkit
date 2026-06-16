<template>
  <LibraryBase
    title="Map Layers"
    itemType="map"
    :viewerComponent="MapViewer"
    :uploadComponent="UploadMapLayer"
    :codeSnippets="codeSnippets"
    :items="mapLayers"
    :isLoading="isLoading"
    :error="error"
    :onDelete="handleDelete"
    @uploaded="handleUploaded"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem, canDelete }">
      <li v-for="(layers, provider) in groupedLayers(items)" :key="provider" class="mb-3">
        <button
          class="group w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          @click="toggleProvider(provider)"
        >
          <div class="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform duration-200" :class="isProviderExpanded(provider) ? 'rotate-0' : '-rotate-90'">
            <ChevronDown class="w-4 h-4 text-slate-500" />
          </div>

          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Globe class="w-5 h-5 text-white" />
          </div>

          <div class="flex-1 min-w-0 text-left">
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">
              {{ getProviderName(provider) }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ layers.length }} layer{{ layers.length > 1 ? 's' : '' }}
            </p>
          </div>

          <Button
            v-if="canDelete"
            variant="ghost"
            size="sm"
            class="opacity-0 group-hover:opacity-100 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200"
            :disabled="deletingProvider === String(provider)"
            @click.stop="requestDeleteAllFromProvider(provider)"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </button>

        <ul v-if="isProviderExpanded(provider)" class="mt-1 ml-9 space-y-1">
          <li v-for="layer in layers" :key="`${layer.url}-${layer.layer}`" class="group">
            <button
              class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left"
              :class="[
                selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url
                  ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50',
              ]"
              @click="selectItem(layer)"
            >
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                :class="[
                  selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-800',
                ]"
              >
                <Layers
                  class="w-5 h-5 transition-colors duration-200"
                  :class="[
                    selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url
                      ? 'text-white'
                      : 'text-slate-500 dark:text-slate-400',
                  ]"
                />
              </div>

              <div class="flex-1 min-w-0">
                <p
                  class="font-medium truncate transition-colors duration-200"
                  :class="[
                    selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-200',
                  ]"
                >
                  {{ layer.description }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  {{ layer.layer }}
                </p>
              </div>

              <Button
                v-if="canDelete"
                variant="ghost"
                size="sm"
                class="opacity-0 group-hover:opacity-100 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200"
                @click.stop="deleteItem(layer)"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </button>
          </li>
        </ul>
      </li>
    </template>
  </LibraryBase>

  <ConfirmDialog
    v-model:open="showDeleteAllConfirm"
    title="Delete All Layers"
    :description="`Are you sure you want to delete ALL layers from '${providerToDelete ? getProviderName(providerToDelete) : ''}'? This action cannot be undone.`"
    confirm-text="Delete All"
    cancel-text="Cancel"
    variant="danger"
    :loading="isDeletingAll"
    @confirm="confirmDeleteAllFromProvider"
    @cancel="cancelDeleteAll"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import LibraryBase from '@/components/LibraryBase.vue';
import MapViewer from '@/components/MapViewer.vue';
import UploadMapLayer from '@/components/UploadMapLayer.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { Button } from '@/components/ui/button';
import { useMapLayersQuery, useDeleteMapLayerMutation, useDeleteAllLayersFromServerMutation } from '@/api';
import type { MapLayer, LibraryItem, GroupedLayers } from '@/types';
import { Trash2, Layers, ChevronDown, Globe } from 'lucide-vue-next';

interface MapLayerItem extends LibraryItem {
  url: string;
  layer: string;
  description: string;
}

const { data: rawMapLayers, isLoading, error, refetch } = useMapLayersQuery();
const deleteMapLayerMutation = useDeleteMapLayerMutation();
const deleteAllFromServerMutation = useDeleteAllLayersFromServerMutation();

const expandedProviders = ref<Map<string, boolean>>(new Map());
const deletingProvider = ref<string | null>(null);

const showDeleteAllConfirm = ref(false);
const providerToDelete = ref<string | null>(null);
const isDeletingAll = ref(false);

const mapLayers = computed<MapLayerItem[]>(() => {
  if (!rawMapLayers.value) return [];
  return rawMapLayers.value as MapLayerItem[];
});

function groupedLayers(layers: LibraryItem[]): GroupedLayers {
  if (!Array.isArray(layers)) return {};
  return (layers as MapLayerItem[]).reduce<GroupedLayers>((acc, layer) => {
    const provider = layer.url;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(layer as MapLayer);
    return acc;
  }, {});
}

function toggleProvider(provider: string | number): void {
  const key = String(provider);
  const current = expandedProviders.value.get(key) ?? false;
  expandedProviders.value.set(key, !current);
}

function isProviderExpanded(provider: string | number): boolean {
  return expandedProviders.value.get(String(provider)) ?? false;
}

function getProviderName(url: string | number): string {
  const urlStr = String(url);
  try {
    const urlObj = new URL(urlStr);
    return urlObj.hostname;
  } catch {
    return urlStr.substring(0, 30) + '...';
  }
}

async function handleDelete(item: LibraryItem): Promise<void> {
  const mapLayer = item as MapLayerItem;
  await deleteMapLayerMutation.mutateAsync({
    url: mapLayer.url,
    layer: mapLayer.layer,
  });
}

function requestDeleteAllFromProvider(provider: string | number): void {
  providerToDelete.value = String(provider);
  showDeleteAllConfirm.value = true;
}

async function confirmDeleteAllFromProvider(): Promise<void> {
  if (!providerToDelete.value) return;

  isDeletingAll.value = true;
  deletingProvider.value = providerToDelete.value;

  try {
    await deleteAllFromServerMutation.mutateAsync(providerToDelete.value);
    void refetch();
    showDeleteAllConfirm.value = false;
    providerToDelete.value = null;
  } finally {
    isDeletingAll.value = false;
    deletingProvider.value = null;
  }
}

function cancelDeleteAll(): void {
  showDeleteAllConfirm.value = false;
  providerToDelete.value = null;
}

function handleUploaded(): void {
  void refetch();
}

function getCesiumJsSnippet(layer: LibraryItem): string {
  const mapLayer = layer as MapLayerItem;
  return `import { Viewer, WebMapServiceImageryProvider } from 'cesium';

const viewer = new Viewer('cesiumContainer');

const wmsProvider = new WebMapServiceImageryProvider({
  url: '${mapLayer.url}',
  layers: '${mapLayer.layer}',
  parameters: {
    transparent: true,
    format: 'image/png'
  }
});

viewer.imageryLayers.addImageryProvider(wmsProvider);`;
}

function getCesiumUnitySnippet(layer: LibraryItem): string {
  const mapLayer = layer as MapLayerItem;
  return `using UnityEngine;
using CesiumForUnity;

public class AddWmsLayer : MonoBehaviour
{
    void Start()
    {
        var wmsOverlay = gameObject.AddComponent<CesiumWebMapServiceRasterOverlay>();
        wmsOverlay.baseUrl = "${mapLayer.url}";
        wmsOverlay.layers = "${mapLayer.layer}";
    }
}`;
}

const codeSnippets = {
  js: getCesiumJsSnippet,
  unity: getCesiumUnitySnippet,
};
</script>