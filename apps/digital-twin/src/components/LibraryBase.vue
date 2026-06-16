<template>
  <!-- Single root so <Transition> (library sub-nav) can target it; the dialogs
       below teleport, so nesting them here has no layout effect. -->
  <div class="h-full w-full">
    <div class="flex h-full w-full gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
    <div class="w-[420px] flex flex-col rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      <div class="flex-shrink-0 p-5 border-b border-slate-200/50 dark:border-slate-700/50">
        <h1 class="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          {{ title }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {{ displayItems.length }} {{ itemType }}{{ displayItems.length !== 1 ? 's' : '' }} available
        </p>
      </div>

      <div class="flex-1 overflow-hidden">
        <div v-if="displayError" class="mx-4 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-600 dark:text-red-400">{{ displayError }}</p>
        </div>

        <div v-if="displayLoading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <div class="mx-auto mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
            <p class="text-slate-500 dark:text-slate-400 font-medium">Loading {{ itemType }}s...</p>
          </div>
        </div>

        <div
          v-else-if="displayItems.length === 0"
          class="flex h-full items-center justify-center p-6"
        >
          <div class="text-center">
            <div class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner">
              <Package class="h-8 w-8 text-slate-400" />
            </div>
            <p class="text-slate-600 dark:text-slate-300 font-medium mb-1">No {{ itemType }}s yet</p>
            <p v-if="uploadComponent && !isAuthenticated" class="text-sm text-slate-500 dark:text-slate-400">
              Sign in to add your first {{ itemType }}
            </p>
          </div>
        </div>

        <div v-else class="h-full overflow-y-auto p-3">
          <ul class="space-y-2">
            <slot
              name="list-item"
              :items="displayItems"
              :selected-item="selectedItem"
              :select-item="selectItem"
              :delete-item="requestDeleteItem"
              :can-delete="canDelete"
              :is-authenticated="isAuthenticated"
            />
          </ul>
        </div>
      </div>

      <div 
    v-if="uploadComponent"
    class="flex-shrink-0 p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30"
  >
    <Button
      v-if="canUpload"
      class="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
      @click="showUploadDialog = true"
    >
      <Plus class="mr-2 h-4 w-4" />
      Add new {{ itemType }}
    </Button>

    <div 
      v-else-if="!isAuthenticated"
      class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Plus class="w-5 h-5 text-primary" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Want to contribute?</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">Sign in to add {{ itemType }}s</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        class="rounded-lg shrink-0"
        @click="openLoginDialog"
      >
        Sign in
      </Button>
    </div>
  </div>
    </div>

    <div class="flex-1 flex flex-col rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      <div v-if="selectedItem" class="flex h-full flex-col">
        <div class="flex-shrink-0 flex items-center px-5 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <FSegmented
            :model-value="activeTab"
            :options="tabOptions"
            @update:model-value="activeTab = $event as 'preview' | 'code'"
          />
        </div>

        <div class="flex-1 min-h-0 overflow-hidden">
          <div v-show="activeTab === 'preview'" class="h-full p-5">
            <div class="h-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-inner">
              <KeepAlive>
                <component :is="viewerComponent" v-bind="viewerProps" />
              </KeepAlive>
            </div>
          </div>

          <div v-show="activeTab === 'code'" class="h-full">
            <div class="h-full bg-slate-900 flex flex-col">
              <div class="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-slate-800/50">
                <div class="flex items-center gap-4">

                  <div class="flex items-center gap-1 p-1 rounded-lg bg-slate-700/50">
                    <button
                      v-for="lang in availableLanguages"
                      :key="lang.key"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                      :class="[
                        selectedLanguage === lang.key
                          ? `${lang.activeBg} ${lang.activeText} shadow-lg ${lang.shadow}`
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-600/50',
                      ]"
                      @click="selectedLanguage = lang.key as CodeLanguage"
                    >
                      <component :is="lang.icon" class="w-3.5 h-3.5" />
                      {{ lang.label }}
                    </button>
                  </div>
                </div>

                <button
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  :class="[
                    copiedCode
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50',
                  ]"
                  @click="copyCode"
                >
                  <Check v-if="copiedCode" class="h-3.5 w-3.5" />
                  <Copy v-else class="h-3.5 w-3.5" />
                  {{ copiedCode ? 'Copied!' : 'Copy code' }}
                </button>
              </div>

              <div class="flex-shrink-0 px-5 py-2 border-b border-slate-700/30 bg-slate-800/30">
                <span class="text-slate-500 text-xs font-mono">{{ getFileName() }}</span>
              </div>

              <div class="flex-1 overflow-auto p-5">
                <pre class="text-sm font-mono text-slate-300 leading-relaxed"><code>{{ currentCodeSnippet }}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex h-full items-center justify-center">
        <div class="text-center max-w-sm">
          <div class="mx-auto mb-6 h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
            <component :is="emptyIcon" class="h-12 w-12 text-primary/60" />
          </div>
          <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Select {{ articlePrefix }} {{ itemType }}
          </h3>
          <p class="text-slate-500 dark:text-slate-400">
            Choose an item from the list to preview it and get ready-to-use integration code
          </p>
        </div>
      </div>
    </div>
  </div>

  <Dialog v-model:open="showUploadDialog">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
      <DialogHeader class="sr-only">
        <DialogTitle>Add {{ itemType }}</DialogTitle>
        <DialogDescription>Upload a new {{ itemType }} to the library</DialogDescription>
      </DialogHeader>
      <component
        :is="uploadComponent"
        v-if="uploadComponent"
        @uploaded="handleItemUploaded"
        @cancel="showUploadDialog = false"
      />
    </DialogContent>
  </Dialog>

  <ConfirmDialog
    v-model:open="showDeleteConfirm"
    title="Delete Item"
    :description="`Are you sure you want to delete '${itemToDelete?.name || itemToDelete?.url || 'this item'}'? This action cannot be undone.`"
    confirm-text="Delete"
    cancel-text="Cancel"
    variant="danger"
    :loading="isDeleting"
    @confirm="confirmDeleteItem"
    @cancel="cancelDelete"
  />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Component, type Ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import type { ItemType, CodeLanguage, LibraryItem } from '@/types';
import { Plus, Code, Copy, Check, Package, Eye, Box, Layers, Building, Radio, FileCode, Gamepad2, Atom } from 'lucide-vue-next';
import { FSegmented } from '@fari-brussels/twin-ui-vue';
import { useLoginDialog } from '@/composables/useLoginDialog';

const { open: openLoginDialog } = useLoginDialog();
const { isAuthenticated, canWrite } = useAuth();

const languageConfig = {
  js: {
    key: 'js',
    label: 'JavaScript',
    icon: FileCode,
    activeBg: 'bg-yellow-500/20',
    activeText: 'text-yellow-300',
    shadow: 'shadow-yellow-500/20',
  },
  unity: {
    key: 'unity',
    label: 'Unity',
    icon: Gamepad2,
    activeBg: 'bg-purple-500/20',
    activeText: 'text-purple-300',
    shadow: 'shadow-purple-500/20',
  },
  react: {
    key: 'react',
    label: 'React',
    icon: Atom,
    activeBg: 'bg-cyan-500/20',
    activeText: 'text-cyan-300',
    shadow: 'shadow-cyan-500/20',
  },
};

interface Props {
  title: string;
  itemType: ItemType;
  viewerComponent: Component;
  uploadComponent?: Component;
  codeSnippets: Partial<Record<CodeLanguage, (item: LibraryItem) => string>>;
  items: LibraryItem[];
  isLoading: boolean;
  error: Error | null;
  onDelete?: (item: LibraryItem) => Promise<void>;
  staticItems?: LibraryItem[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  uploaded: [];
}>();



const selectedItem = ref<LibraryItem | null>(null) as Ref<LibraryItem | null>;
const showUploadDialog = ref(false);
const selectedLanguage = ref<CodeLanguage>('js');
const deleteError = ref<string | null>(null);
const copiedCode = ref(false);
const activeTab = ref<'preview' | 'code'>('preview');
const tabOptions = [
  { value: 'preview', label: 'Preview', icon: Eye },
  { value: 'code', label: 'Integration Code', icon: Code },
];

const showDeleteConfirm = ref(false);
const itemToDelete = ref<LibraryItem | null>(null);
const isDeleting = ref(false);

const availableLanguages = computed(() => {
  return Object.keys(props.codeSnippets)
    .filter(key => key in languageConfig)
    .map(key => languageConfig[key as keyof typeof languageConfig]);
});

const displayItems = computed(() => {
  if (props.staticItems && props.staticItems.length > 0) {
    return props.staticItems;
  }
  return props.items;
});

const displayLoading = computed(() => {
  if (props.staticItems) return false;
  return props.isLoading;
});

const displayError = computed(() => {
  if (deleteError.value) return deleteError.value;
  if (props.error) {
    return `Failed to fetch ${props.itemType}s. Make sure the backend server is running.`;
  }
  return null;
});

const viewerProps = computed<Record<string, unknown>>(() => {
  if (!selectedItem.value) return {};

  switch (props.itemType) {
    case 'asset':
      return { assetUrl: selectedItem.value.url };
    case 'map':
      return { mapLayer: selectedItem.value };
    case 'tileset':
      return { tilesetUrl: selectedItem.value.url };
    case 'dataset':
      return { dataset: selectedItem.value };
    default:
      return {};
  }
});

const currentCodeSnippet = computed<string>(() => {
  if (!selectedItem.value) return '';
  const snippetGenerator = props.codeSnippets[selectedLanguage.value];
  return snippetGenerator ? snippetGenerator(selectedItem.value) : '';
});

const emptyIcon = computed(() => {
  switch (props.itemType) {
    case 'asset':
      return Box;
    case 'map':
      return Layers;
    case 'tileset':
      return Building;
    case 'dataset':
      return Radio;
    default:
      return Package;
  }
});

const articlePrefix = computed(() => {
  const firstChar = props.itemType[0]?.toLowerCase();
  return firstChar && ['a', 'e', 'i', 'o', 'u'].includes(firstChar) ? 'an' : 'a';
});

const canUpload = computed(() => {
  return props.uploadComponent && canWrite.value;
});

const canDelete = computed(() => {
  return props.onDelete && canWrite.value;
});

function getFileName(): string {
  const capitalizedType = props.itemType.charAt(0).toUpperCase() + props.itemType.slice(1);
  
  switch (selectedLanguage.value) {
    case 'js':
      return `${props.itemType}-loader.js`;
    case 'unity':
      return `${capitalizedType}Loader.cs`;
    case 'react':
      return `use${capitalizedType}.tsx`;
    default:
      return 'code.txt';
  }
}

watch(
  displayItems,
  newItems => {
    if (newItems.length > 0 && !selectedItem.value) {
      selectedItem.value = newItems[0] ?? null;
    }
  },
  { immediate: true }
);

watch(
  availableLanguages,
  langs => {
    if (langs.length > 0 && !langs.find(l => l.key === selectedLanguage.value)) {
      const firstLang = langs[0];
      if (firstLang) {
        selectedLanguage.value = firstLang.key as CodeLanguage;
      }
    }
  },
  { immediate: true }
);

function handleItemUploaded(): void {
  showUploadDialog.value = false;
  emit('uploaded');
}

function requestDeleteItem(item: LibraryItem): void {
  if (!props.onDelete || !canWrite.value) {
    console.error('No delete handler provided or not authorized');
    return;
  }
  itemToDelete.value = item;
  showDeleteConfirm.value = true;
}

async function confirmDeleteItem(): Promise<void> {
  if (!props.onDelete || !itemToDelete.value) return;

  deleteError.value = null;
  isDeleting.value = true;

  try {
    await props.onDelete(itemToDelete.value);
    if (selectedItem.value?.url === itemToDelete.value.url || selectedItem.value?.id === itemToDelete.value.id) {
      const remaining = displayItems.value.filter(
        i => i.url !== itemToDelete.value?.url && i.id !== itemToDelete.value?.id
      );
      selectedItem.value = remaining.length > 0 ? (remaining[0] ?? null) : null;
    }
    showDeleteConfirm.value = false;
    itemToDelete.value = null;
  } catch (err) {
    console.error(`Error deleting ${props.itemType}:`, err);
    deleteError.value = `Failed to delete ${props.itemType}.`;
  } finally {
    isDeleting.value = false;
  }
}

function cancelDelete(): void {
  showDeleteConfirm.value = false;
  itemToDelete.value = null;
}

function selectItem(item: LibraryItem): void {
  selectedItem.value = item;
}

async function copyCode(): Promise<void> {
  if (!currentCodeSnippet.value) return;
  try {
    await window.navigator.clipboard.writeText(currentCodeSnippet.value);
    copiedCode.value = true;
    setTimeout(() => {
      copiedCode.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
  }
}
</script>