<script setup lang="ts">
/**
 * UploadTileset - Upload form for 3D Tilesets
 * Requires authentication to upload
 * Supports async upload processing for large files with progress tracking
 */
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useUploadTilesetMutation, pollUploadStatus, type UploadStatusResponse } from '@/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import LoginPrompt from '@/components/LoginPrompt.vue';
import { Upload, FileArchive, X, CheckCircle2, AlertCircle, Building, Loader2 } from 'lucide-vue-next';

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  uploaded: [];
  cancel: [];
}>();

// ============================================================================
// Auth
// ============================================================================

const { isAuthenticated, canWrite } = useAuth();

// ============================================================================
// State
// ============================================================================

const file = ref<File | null>(null);
const description = ref('');
const source = ref('');
const successMessage = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

// Async upload state
const isProcessing = ref(false);
const processingStatus = ref<'pending' | 'processing' | 'completed' | 'failed'>('pending');
const processingProgress = ref(0);

// ============================================================================
// Mutation
// ============================================================================

const uploadMutation = useUploadTilesetMutation();

const error = computed(() => {
  if (uploadMutation.error.value) {
    return 'Failed to upload tileset. Please try again.';
  }
  return null;
});

const uploading = computed(() => uploadMutation.isPending.value);

// ============================================================================
// Methods
// ============================================================================

function handleFileChange(event: globalThis.Event): void {
  const target = event.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
  successMessage.value = '';
  uploadMutation.reset();
}

function handleDrop(event: globalThis.DragEvent): void {
  isDragging.value = false;
  const droppedFile = event.dataTransfer?.files?.[0];
  if (droppedFile && droppedFile.name.endsWith('.zip')) {
    file.value = droppedFile;
    successMessage.value = '';
    uploadMutation.reset();
  }
}

function handleDragOver(event: globalThis.DragEvent): void {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(): void {
  isDragging.value = false;
}

function clearFile(): void {
  file.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

async function uploadTileset(): Promise<void> {
  if (!file.value || !description.value || !source.value || !canWrite.value) {
    return;
  }

  const formData = new FormData();
  formData.append('file', file.value);
  formData.append('description', description.value);
  formData.append('source', source.value);

  successMessage.value = '';
  isProcessing.value = false;
  processingProgress.value = 0;

  try {
    const result = await uploadMutation.mutateAsync(formData);

    // Handle async upload - poll for completion
    if (result.isAsync) {
      isProcessing.value = true;
      processingStatus.value = 'pending';
      processingProgress.value = 10;

      const finalStatus = await pollUploadStatus(
        result.id,
        (status: UploadStatusResponse) => {
          processingStatus.value = status.status;
          // Simulate progress based on status
          if (status.status === 'processing') {
            processingProgress.value = Math.min(processingProgress.value + 5, 90);
          }
        }
      );

      isProcessing.value = false;

      if (finalStatus.status === 'failed') {
        throw new Error(finalStatus.error || 'Upload processing failed');
      }

      processingProgress.value = 100;
    }

    successMessage.value = 'Tileset uploaded successfully!';
    description.value = '';
    source.value = '';
    clearFile();

    setTimeout(() => {
      emit('uploaded');
    }, 1500);
  } catch (err) {
    isProcessing.value = false;
    // If it's a custom error from polling, show it
    if (err instanceof Error && err.message !== 'Upload processing failed') {
      uploadMutation.error.value = err;
    }
  }
}

function handleCancel(): void {
  emit('cancel');
}
</script>

<template>
  <div class="w-full">
    <!-- Auth check -->
    <LoginPrompt
      v-if="!isAuthenticated"
      action="upload tilesets"
      title="Sign in to Upload"
      description="Create an account or sign in to upload 3D tilesets to the library."
    />

    <!-- Upload form (authenticated) -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center gap-3 mb-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Building class="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-foreground">Upload New Tileset</h2>
          <p class="text-sm text-muted-foreground">Add a Cesium 3D Tileset to the library</p>
        </div>
      </div>

      <Separator class="my-4" />

      <form class="space-y-5" @submit.prevent="uploadTileset">
        <!-- Drag & Drop Zone -->
        <div
          class="relative rounded-lg border-2 border-dashed transition-colors"
          :class="[
            isDragging
              ? 'border-accent bg-accent/5'
              : file
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-accent/50 hover:bg-muted/50',
          ]"
          @drop.prevent="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".zip"
            class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            @change="handleFileChange"
          />

          <div class="p-6 text-center">
            <template v-if="file">
              <div class="flex items-center justify-center gap-3">
                <FileArchive class="h-8 w-8 text-primary" />
                <div class="text-left">
                  <p class="font-medium text-foreground">{{ file.name }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ (file.size / 1024 / 1024).toFixed(2) }} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="ml-auto text-muted-foreground hover:text-destructive"
                  @click.stop="clearFile"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </template>
            <template v-else>
              <FileArchive class="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p class="mb-1 font-medium text-foreground">
                Drop your tileset here or click to browse
              </p>
              <p class="text-sm text-muted-foreground">
                ZIP archive containing tileset.json and tile files
              </p>
            </template>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="tileset-description">
            Description <span class="text-destructive">*</span>
          </Label>
          <Textarea
            id="tileset-description"
            v-model="description"
            placeholder="Describe your tileset..."
            required
          />
        </div>

        <!-- Source URL -->
        <div class="space-y-2">
          <Label for="tileset-source">
            Source URL <span class="text-destructive">*</span>
          </Label>
          <Input
            id="tileset-source"
            v-model="source"
            type="url"
            placeholder="https://example.com/original-tileset"
            required
          />
          <p class="text-xs text-muted-foreground">
            Link to the original source or documentation of this tileset
          </p>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive"
        >
          <AlertCircle class="h-5 w-5 flex-shrink-0" />
          <span class="text-sm">{{ error }}</span>
        </div>

        <!-- Processing Progress (async upload) -->
        <div
          v-if="isProcessing"
          class="space-y-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-4"
        >
          <div class="flex items-center gap-3">
            <Loader2 class="h-5 w-5 animate-spin text-accent" />
            <div class="flex-1">
              <p class="font-medium text-foreground">
                {{ processingStatus === 'pending' ? 'Queued for processing...' : 'Extracting tileset files...' }}
              </p>
              <p class="text-sm text-muted-foreground">
                Large files are processed in the background. This may take a few minutes.
              </p>
            </div>
          </div>
          <Progress :model-value="processingProgress" class="h-2" />
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
            :disabled="!file || !description || !source || uploading || isProcessing"
          >
            <Loader2 v-if="uploading || isProcessing" class="mr-2 h-4 w-4 animate-spin" />
            <Upload v-else class="mr-2 h-4 w-4" />
            {{ uploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Upload Tileset' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
