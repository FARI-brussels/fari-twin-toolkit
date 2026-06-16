<template>
  <LibraryBase
    title="Asset Library"
    itemType="asset"
    :viewerComponent="AssetViewer"
    :uploadComponent="UploadAsset"
    :codeSnippets="codeSnippets"
    :items="assets"
    :isLoading="isLoading"
    :error="error"
    :onDelete="handleDelete"
    @uploaded="handleUploaded"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem, canDelete }">
      <li
        v-for="item in items"
        :key="item.id"
        class="group relative"
      >
        <button
          class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left"
          :class="[
            selectedItem && selectedItem.id === item.id
              ? 'bg-gradient-to-r from-primary/15 to-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/30'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/50',
          ]"
          @click="selectItem(item)"
        >
          <!-- Icon -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
            :class="[
              selectedItem && selectedItem.id === item.id
                ? 'bg-gradient-to-br from-amber-500 to-orange-700 shadow-lg shadow-primary/30'
                : 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800',
            ]"
          >
            <Box
              class="w-5 h-5 transition-colors duration-200"
              :class="[
                selectedItem && selectedItem.id === item.id
                  ? 'text-white'
                  : 'text-slate-500 dark:text-slate-400',
              ]"
            />
          </div>

          <div class="flex-1 min-w-0">
            <p 
              class="font-semibold truncate transition-colors duration-200"
              :class="[
                selectedItem && selectedItem.id === item.id
                  ? 'text-primary dark:text-primary'
                  : 'text-slate-700 dark:text-slate-200',
              ]"
            >
              {{ item.name }}
            </p>
            <p v-if="item.description" class="text-sm text-slate-500 dark:text-slate-400 truncate">
              {{ item.description }}
            </p>
          </div>

          <Button
            v-if="canDelete"
            variant="ghost"
            size="sm"
            class="opacity-0 group-hover:opacity-100 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200"
            @click.stop="deleteItem(item)"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </button>
      </li>
    </template>
  </LibraryBase>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LibraryBase from '@/components/LibraryBase.vue';
import AssetViewer from '@/components/AssetViewer.vue';
import UploadAsset from '@/components/UploadAsset.vue';
import { Button } from '@/components/ui/button';
import { useAssetsQuery, useDeleteAssetMutation } from '@/api';
import type { Asset, LibraryItem } from '@/types';
import { Trash2, Box } from 'lucide-vue-next';

interface AssetItem extends LibraryItem {
  url: string;
  name: string;
  description?: string;
  options?: {
    orientation: number[];
    scale: number;
  };
}

const { data: rawAssets, isLoading, error, refetch } = useAssetsQuery();
const deleteAssetMutation = useDeleteAssetMutation();

const assets = computed<AssetItem[]>(() => {
  if (!rawAssets.value) return [];
  return rawAssets.value?.map((asset: Asset) => ({
    ...asset,
    name: asset.url.split('/').pop() ?? 'Unknown',
  }));
});

async function handleDelete(item: LibraryItem): Promise<void> {
  if (item.id === undefined || item.id === null) throw new Error('Asset has no ID');
  await deleteAssetMutation.mutateAsync(Number(item.id));
}

function handleUploaded(): void {
  void refetch();
}

function getCesiumJsSnippet(asset: LibraryItem): string {
  return `import { Viewer, Cartesian3, HeadingPitchRange, Math as CesiumMath } from 'cesium';

const viewer = new Viewer('cesiumContainer');
const position = Cartesian3.fromDegrees(4.3517, 50.8503, 0);

const entity = viewer.entities.add({
  position: position,
  model: {
    uri: '${asset.url}',
    minimumPixelSize: 128,
    maximumScale: 20000
  }
});

viewer.zoomTo(entity, new HeadingPitchRange(
  CesiumMath.toRadians(45),
  CesiumMath.toRadians(-30),
  200
));`;
}

function getCesiumUnitySnippet(asset: LibraryItem): string {
  return `using UnityEngine;
using CesiumForUnity;

public class LoadGltfModel : MonoBehaviour
{
    void Start()
    {
        var gltfModel = gameObject.AddComponent<CesiumGltfModel>();
        gltfModel.url = "${asset.url}";
    }
}`;
}

const codeSnippets = {
  js: getCesiumJsSnippet,
  unity: getCesiumUnitySnippet,
};
</script>