<template>
  <div class="w-full">
    <!-- Auth check -->
    <LoginPrompt
      v-if="!isAuthenticated"
      action="add map layers"
      title="Sign in to Add Layers"
      description="Create an account or sign in to add WMS map layers to the library."
    />

    <div v-else>
      <div class="flex items-center gap-3 mb-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Layers class="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-foreground">Add WMS Layers</h2>
          <p class="text-sm text-muted-foreground">Connect a WMS service to browse and add map layers</p>
        </div>
      </div>

      <Separator class="my-4" />

      <form class="space-y-5" @submit.prevent="addSelectedLayers">
        <!-- WMS URL Input -->
        <div class="space-y-2">
          <Label for="wms-url">
            WMS Service URL <span class="text-destructive">*</span>
          </Label>
          <div class="flex gap-2">
            <Input
              id="wms-url"
              v-model="url"
              type="url"
              placeholder="https://example.com/geoserver/wms"
              class="flex-1"
            />
            <Button
              type="button"
              :disabled="!url || isFetching"
              @click="fetchCapabilities"
            >
              <Loader2 v-if="isFetching" class="mr-2 h-4 w-4 animate-spin" />
              <Search v-else class="mr-2 h-4 w-4" />
              {{ isFetching ? 'Loading...' : 'Fetch Layers' }}
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            Enter the WMS endpoint URL (e.g., https://geoservices-urbis.irisnet.be/geoserver/urbisvector/wms)
          </p>
        </div>

        <!-- Fetch Error -->
        <div
          v-if="fetchError"
          class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive"
        >
          <AlertCircle class="h-5 w-5 flex-shrink-0" />
          <span class="text-sm">{{ fetchError }}</span>
        </div>

        <!-- Available Layers -->
        <div v-if="availableLayers.length > 0" class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Label>Available Layers ({{ availableLayers.length }})</Label>
              <Badge v-if="alreadyAddedCount > 0" variant="secondary" class="text-xs">
                {{ alreadyAddedCount }} already added
              </Badge>
            </div>
            <div class="flex gap-2">
              <Button type="button" variant="ghost" size="sm" @click="selectAll">
                Select All
              </Button>
              <Button type="button" variant="ghost" size="sm" @click="deselectAll">
                Deselect All
              </Button>
            </div>
          </div>

          <!-- Search -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="Search layers..."
              class="pl-9"
            />
          </div>

          <!-- Layer List -->
          <ScrollArea class="h-64 rounded-md border">
            <div class="p-2 space-y-1">
              <div
                v-for="layer in filteredLayers"
                :key="layer.name"
                class="flex items-start gap-3 p-2 rounded-md transition-colors"
                :class="[
                  isLayerAlreadyAdded(layer.name)
                    ? 'opacity-60 cursor-not-allowed bg-muted/50'
                    : 'hover:bg-accent cursor-pointer'
                ]"
                @click="toggleLayer(layer.name)"
              >
                <!-- Show check icon for already added, checkbox for others -->
                <div v-if="isLayerAlreadyAdded(layer.name)" class="mt-0.5 h-4 w-4 flex items-center justify-center">
                  <Check class="h-4 w-4 text-secondary" />
                </div>
                <Checkbox
                  v-else
                  :model-value="isLayerSelected(layer.name)"
                  class="mt-0.5"
                  @click.stop
                  @update:model-value="toggleLayer(layer.name)"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium truncate">{{ layer.title || layer.name }}</p>
                    <Badge v-if="isLayerAlreadyAdded(layer.name)" variant="outline" class="text-xs shrink-0">
                      Added
                    </Badge>
                  </div>
                  <p class="text-xs text-muted-foreground font-mono">{{ layer.name }}</p>
                  <p v-if="layer.abstract" class="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {{ layer.abstract }}
                  </p>
                </div>
              </div>
              <div v-if="filteredLayers.length === 0" class="p-4 text-center text-sm text-muted-foreground">
                No layers match your search
              </div>
            </div>
          </ScrollArea>

          <p v-if="hasSelectedLayers" class="text-sm text-muted-foreground">
            {{ selectedCount }} layer(s) selected
          </p>
        </div>

        <!-- Mutation Error -->
        <div
          v-if="error"
          class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive"
        >
          <AlertCircle class="h-5 w-5 flex-shrink-0" />
          <span class="text-sm">{{ error }}</span>
        </div>

        <!-- Success Message -->
        <div
          v-if="successMessage"
          class="flex items-center gap-2 rounded-lg border border-secondary/20 bg-secondary/10 px-4 py-3 text-secondary-foreground"
        >
          <CheckCircle2 class="h-5 w-5 flex-shrink-0 text-secondary" />
          <span class="text-sm">{{ successMessage }}</span>
        </div>

        <Separator />

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <Button type="button" variant="outline" @click="handleCancel">
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!hasSelectedLayers || submitting"
          >
            <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
            <Plus v-else class="mr-2 h-4 w-4" />
            {{ submitting ? 'Adding...' : `Add ${selectedCount} Layer(s)` }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useAddMapLayerMutation, useMapLayersQuery } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import LoginPrompt from '@/components/LoginPrompt.vue';
import { Layers, Plus, AlertCircle, CheckCircle2, Loader2, Search, Check } from 'lucide-vue-next';

interface WMSLayer {
  name: string;
  title: string;
  abstract: string;
}

const emit = defineEmits<{
  uploaded: [];
  cancel: [];
}>();


const { isAuthenticated, canWrite } = useAuth();

const url = ref('');
const availableLayers = ref<WMSLayer[]>([]);
const selectedLayers = ref<string[]>([]);
const searchQuery = ref('');
const successMessage = ref('');
const fetchError = ref('');
const isFetching = ref(false);

const addLayerMutation = useAddMapLayerMutation();

const { data: existingLayers } = useMapLayersQuery();

const error = computed(() => {
  if (addLayerMutation.error.value) {
    return 'Failed to add map layers. Please check the details and try again.';
  }
  return null;
});

const submitting = computed(() => addLayerMutation.isPending.value);

const filteredLayers = computed(() => {
  if (!searchQuery.value) return availableLayers.value;
  const query = searchQuery.value.toLowerCase();
  return availableLayers.value.filter(
    layer =>
      layer.name.toLowerCase().includes(query) ||
      layer.title.toLowerCase().includes(query) ||
      layer.abstract.toLowerCase().includes(query)
  );
});

const hasSelectedLayers = computed(() => selectedLayers.value.length > 0);

const selectedCount = computed(() => selectedLayers.value.length);

const alreadyAddedCount = computed(() => {
  if (!existingLayers.value || availableLayers.value.length === 0) return 0;
  const baseUrl = url.value.split('?')[0];
  return availableLayers.value.filter(layer =>
    existingLayers.value!.some(
      existing => existing.url === baseUrl && existing.layer === layer.name
    )
  ).length;
});

function parseCapabilities(xmlText: string): WMSLayer[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const layers: WMSLayer[] = [];
  const layerElements = xmlDoc.querySelectorAll('Layer > Layer');

  layerElements.forEach(layerEl => {
    const name = layerEl.querySelector('Name')?.textContent || '';
    const title = layerEl.querySelector('Title')?.textContent || '';
    const abstract = layerEl.querySelector('Abstract')?.textContent || '';

    if (name) layers.push({ name, title, abstract });
    
  });

  return layers;
}

async function fetchCapabilities(): Promise<void> {
  if (!url.value) return;

  availableLayers.value = [];
  selectedLayers.value = [];
  fetchError.value = '';
  successMessage.value = '';
  isFetching.value = true;

  try {
    const baseUrl = url.value.split('?')[0];
    const capabilitiesUrl = `${baseUrl}?service=WMS&request=GetCapabilities`;

    const response = await fetch(capabilitiesUrl);

    if (!response.ok)
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    

    const xmlText = await response.text();

    if (!xmlText.includes('WMS_Capabilities') && !xmlText.includes('WMT_MS_Capabilities'))
      throw new Error('Invalid WMS GetCapabilities response');
    

    availableLayers.value = parseCapabilities(xmlText);

    if (availableLayers.value.length === 0) 
      fetchError.value = 'No layers found in this WMS service';
    
  } catch (err) {

    if (err instanceof TypeError && err.message.includes('fetch')) 
      fetchError.value = 'Unable to connect to the WMS server. This may be due to CORS restrictions.';
    else 
      fetchError.value = err instanceof Error ? err.message : 'Failed to fetch capabilities';

  } finally {
    isFetching.value = false;
  }
}

function toggleLayer(layerName: string): void {
  if (isLayerAlreadyAdded(layerName)) return;

  const index = selectedLayers.value.indexOf(layerName);
  if (index > -1) selectedLayers.value.splice(index, 1);
  else selectedLayers.value.push(layerName);

}

function isLayerAlreadyAdded(layerName: string): boolean {
  if (!existingLayers.value) return false;
  const baseUrl = url.value.split('?')[0];
  return existingLayers.value.some(
    existing => existing.url === baseUrl && existing.layer === layerName
  );
}

function isLayerSelected(layerName: string): boolean {
  return selectedLayers.value.includes(layerName);
}

function selectAll(): void {
  filteredLayers.value.forEach(layer => {
    if (!isLayerAlreadyAdded(layer.name) && !isLayerSelected(layer.name)) {
      selectedLayers.value.push(layer.name);
    }
  });
}

function deselectAll(): void {
  selectedLayers.value = [];
}

async function addSelectedLayers(): Promise<void> {
  if (!canWrite.value || !hasSelectedLayers.value) return;

  successMessage.value = '';
  addLayerMutation.reset();

  try {
    const baseUrl = url.value.split('?')[0] ?? '';

    for (const layerName of selectedLayers.value) {
      const layer = availableLayers.value.find(l => l.name === layerName);
      await addLayerMutation.mutateAsync({
        url: baseUrl,
        layer: layerName,
        description: layer?.title ?? layer?.abstract ?? layerName,
      });
    }

    successMessage.value = `Successfully added ${selectedLayers.value.length} layer(s)!`;

    setTimeout(() => {
      url.value = '';
      availableLayers.value = [];
      selectedLayers.value = [];
      emit('uploaded');
    }, 1500);
  } catch {
    // Error is handled by the mutation, but logging for debugging
    console.error('Error adding layers:', error);
  }
}

function handleCancel(): void {
  emit('cancel');
}

watch(url, (newUrl, oldUrl) => {
  if (newUrl && oldUrl) {
    const newBase = newUrl.split('?')[0];
    const oldBase = oldUrl.split('?')[0];
    if (newBase !== oldBase) {
      availableLayers.value = [];
      selectedLayers.value = [];
      fetchError.value = '';
    }
  }
});
</script>


