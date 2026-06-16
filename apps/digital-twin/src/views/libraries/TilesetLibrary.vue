<script setup lang="ts">
import { computed } from 'vue';
import LibraryBase from '@/components/LibraryBase.vue';
import TilesetViewer from '@/components/TilesetViewer.vue';
import UploadTileset from '@/components/UploadTileset.vue';
import { Button } from '@/components/ui/button';
import { useTilesetsQuery, useDeleteTilesetMutation } from '@/api';
import type { Tileset, LibraryItem } from '@/types';
import { Trash2, Building } from 'lucide-vue-next';

interface TilesetItem extends LibraryItem {
  url: string;
  description: string;
}

const { data: rawTilesets, isLoading, error, refetch } = useTilesetsQuery();
const deleteTilesetMutation = useDeleteTilesetMutation();

const tilesets = computed<TilesetItem[]>(() => {
  if (!rawTilesets.value) return [];
  return rawTilesets.value.map((tileset: Tileset) => ({
    ...tileset,
    description: tileset.description ?? 'No description',
  }));
});

async function handleDelete(item: LibraryItem): Promise<void> {
  if (!item.url) throw new Error('Tileset has no URL');
  await deleteTilesetMutation.mutateAsync(item.url);
}

function handleUploaded(): void {
  void refetch();
}

function getCesiumJsSnippet(tileset: LibraryItem): string {
  return `import { Cesium3DTileset } from 'cesium';

try {
  const tileset = await Cesium3DTileset.fromUrl(
    '${tileset.url}'
  );
  
  viewer.scene.primitives.add(tileset);
  await viewer.zoomTo(tileset);
} catch (error) {
  console.error(\`Error loading tileset: \${error}\`);
}`;
}

function getCesiumUnitySnippet(tileset: LibraryItem): string {
  return `using UnityEngine;
using CesiumForUnity;

public class AddTilesetFromUrl : MonoBehaviour
{
    void Start()
    {
        var tileset = gameObject.AddComponent<Cesium3DTileset>();
        tileset.url = "${tileset.url}";
    }
}`;
}

const codeSnippets = {
  js: getCesiumJsSnippet,
  unity: getCesiumUnitySnippet,
};
</script>

<template>
  <LibraryBase
    title="3D Tilesets"
    itemType="tileset"
    :viewerComponent="TilesetViewer"
    :uploadComponent="UploadTileset"
    :codeSnippets="codeSnippets"
    :items="tilesets"
    :isLoading="isLoading"
    :error="error"
    :onDelete="handleDelete"
    @uploaded="handleUploaded"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem, canDelete }">
      <li
        v-for="item in items"
        :key="item.id"
        class="group"
      >
        <button
          class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left"
          :class="[
            selectedItem && selectedItem.id === item.id
              ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/50',
          ]"
          @click="selectItem(item)"
        >
          <!-- Icon -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
            :class="[
              selectedItem && selectedItem.id === item.id
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30'
                : 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800',
            ]"
          >
            <Building
              class="w-5 h-5 transition-colors duration-200"
              :class="[
                selectedItem && selectedItem.id === item.id
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
                selectedItem && selectedItem.id === item.id
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-700 dark:text-slate-200',
              ]"
            >
              {{ item.description }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
              {{ item.url?.split('/').pop() ?? '' }}
            </p>
          </div>

          <!-- Delete button -->
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