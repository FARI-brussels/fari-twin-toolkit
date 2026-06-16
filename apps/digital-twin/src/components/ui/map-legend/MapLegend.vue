<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div 
      v-if="legend?.items?.length || imageSrc" 
      class="rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/50 overflow-hidden"
    >
      <div class="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
        <Map v-if="showIcon" class="w-4 h-4 text-slate-400" />
        <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {{ displayTitle }}
        </span>
      </div>

      <div class="p-3">
        <div v-if="legend?.items?.length" class="space-y-1.5">
          <div
            v-for="(item, index) in legend.items"
            :key="index"
            class="flex items-center gap-2"
          >
            <div
              class="w-3 h-3 rounded-sm flex-shrink-0 shadow-sm"
              :style="{ backgroundColor: item.color }"
            />
            <span class="text-xs text-slate-600">{{ item.label }}</span>
          </div>
        </div>

        <img
          v-else-if="imageSrc"
          :key="imageSrc"
          :src="imageSrc"
          :alt="imageAlt"
          class="max-w-[180px] max-h-[200px] rounded-lg border border-slate-100"
          loading="lazy"
          @error="handleImageError"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Map } from 'lucide-vue-next';

export interface LegendItem {
  color: string;
  label: string;
}

export interface Legend {
  title?: string;
  items: LegendItem[];
}

const props = withDefaults(
  defineProps<{
    legend?: {
      title: string; 
      items: {
        color: string;
        label: string;
      }[]
    } | null;
    imageSrc?: string;
    imageAlt?: string;
    title?: string;
    showIcon?: boolean;
  }>(),
  {
    imageAlt: 'Layer Legend',
    title: 'Map info',
    showIcon: true,
  }
);

const displayTitle = computed(() => {
  return props.legend?.title || props.title;
});

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};
</script>