
<template>
  <div class="w-full">
    <LoginPrompt
      v-if="!isAuthenticated"
      action="upload assets"
      title="Sign in to Upload"
      description="Create an account or sign in to upload 3D models and assets to the library."
    />

    <div v-else>
      <div class="flex items-center gap-3 mb-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Upload class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-foreground">Upload New Asset</h2>
          <p class="text-sm text-muted-foreground">Add a 3D model to your library</p>
        </div>
      </div>

      <Separator class="my-4" />

      <form class="space-y-5" @submit.prevent="uploadAsset">
        <div
          class="relative rounded-lg border-2 border-dashed transition-colors"
          :class="[
            isDragging
              ? 'border-primary bg-primary/5'
              : file
                ? 'border-secondary bg-secondary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50',
          ]"
          @drop.prevent="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".glb,.gltf,.obj,.fbx"
            class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            @change="handleFileChange"
          />

          <div class="p-6 text-center">
            <template v-if="file">
              <div class="flex items-center justify-center gap-3">
                <FileUp class="h-8 w-8 text-secondary" />
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
              <FileUp class="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p class="mb-1 font-medium text-foreground">
                Drop your file here or click to browse
              </p>
              <p class="text-sm text-muted-foreground">
                Supports glTF, GLB, OBJ, FBX formats
              </p>
            </template>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="description">
            Description <span class="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            v-model="description"
            placeholder="Describe your asset..."
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="source">
            Source URL <span class="text-destructive">*</span>
          </Label>
          <Input
            id="source"
            v-model="source"
            type="url"
            placeholder="https://example.com/original-asset"
            required
          />
          <p class="text-xs text-muted-foreground">
            Link to the original source or documentation of this asset
          </p>
        </div>

        <div
          v-if="error"
          class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive"
        >
          <AlertCircle class="h-5 w-5 flex-shrink-0" />
          <span class="text-sm">{{ error }}</span>
        </div>

        <div
          v-if="successMessage"
          class="flex items-center gap-2 rounded-lg border border-secondary/20 bg-secondary/10 px-4 py-3 text-secondary-foreground"
        >
          <CheckCircle2 class="h-5 w-5 flex-shrink-0 text-secondary" />
          <span class="text-sm">{{ successMessage }}</span>
        </div>

        <Separator />

        <div class="flex justify-end gap-3">
          <Button type="button" variant="outline" @click="handleCancel">
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!file || !description || !source || uploading"
          >
            <Upload class="mr-2 h-4 w-4" />
            {{ uploading ? 'Uploading...' : 'Upload Asset' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useUploadAssetMutation } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import LoginPrompt from '@/components/LoginPrompt.vue';
import { Upload, FileUp, X, CheckCircle2, AlertCircle } from 'lucide-vue-next';


const emit = defineEmits<{
  uploaded: [];
  cancel: [];
}>();


const { isAuthenticated, canWrite } = useAuth();


const file = ref<File | null>(null);
const description = ref('');
const source = ref('');
const successMessage = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);


const uploadMutation = useUploadAssetMutation();

const error = computed(() => {
  if (uploadMutation.error.value) {
    return 'Failed to upload asset. Please try again.';
  }
  return null;
});

const uploading = computed(() => uploadMutation.isPending.value);

function handleFileChange(event: globalThis.Event): void {
  const target = event.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
  successMessage.value = '';
  uploadMutation.reset();
}

function handleDrop(event: globalThis.DragEvent): void {
  isDragging.value = false;
  const droppedFile = event.dataTransfer?.files?.[0];
  if (droppedFile) {
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

async function uploadAsset(): Promise<void> {
  if (!file.value || !description.value || !source.value || !canWrite.value) {
    return;
  }

  const formData = new FormData();
  formData.append('file', file.value);
  formData.append('description', description.value);
  formData.append('source', source.value);

  successMessage.value = '';

  try {
    await uploadMutation.mutateAsync(formData);
    successMessage.value = 'Asset uploaded successfully!';
    description.value = '';
    source.value = '';
    clearFile();

    setTimeout(() => {
      emit('uploaded');
    }, 1500);
  } catch {
    // Error is handled by the mutation
  }
}

function handleCancel(): void {
  emit('cancel');
}
</script>

