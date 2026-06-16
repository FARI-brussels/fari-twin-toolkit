<template>
  <div class="h-screen flex flex-col "
  >
        <div class="absolute inset-0">
        <img 
          :src="bxlScreenshot" 
          alt="Brussels Digital Twin" 
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/50" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
      </div>
    <!-- Always-detached floating dock header (no clumsy scroll toggling). -->
    <div class="sticky top-0 z-50 px-4 pt-4 pointer-events-none">
      <Header class="pointer-events-auto" />
    </div>
    <main class="flex-1">
      <slot />
    </main>
    <LoginDialog v-model="isLoginDialogOpen" />

    <!-- Liquid-glass refraction filter (used by .liquid-glass via backdrop-filter).
         R/G/B are displaced by different amounts → chromatic aberration, the
         tell-tale colour fringing of real glass at high-contrast edges. -->
    <svg class="pointer-events-none absolute h-0 w-0" aria-hidden="true">
      <defs>
        <filter
          id="liquid-glass"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          color-interpolation-filters="sRGB"
        >
          <!-- A bevel normal-map (generated at runtime): neutral in the centre,
               strong inward normals at the edges → an edge-lens, refracting most
               at the borders like real glass. -->
          <feImage
            :href="glassMap"
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="52"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispR"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="40"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispG"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="28"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispB"
          />
          <feColorMatrix
            in="dispR"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="r"
          />
          <feColorMatrix
            in="dispG"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="g"
          />
          <feColorMatrix
            in="dispB"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="b"
          />
          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" />
        </filter>
      </defs>
    </svg>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Header from './Header.vue';
import LoginDialog from './LoginDialog.vue';
import { useLoginDialog } from '@/composables/useLoginDialog';
import bxlScreenshot from '@/assets/bxl_screenshot.png';

const { isOpen: isLoginDialogOpen } = useLoginDialog();

// Data-URL bevel normal-map for the liquid-glass edge-lens filter.
const glassMap = ref('');

/**
 * Generate a bevel normal-map: R/G encode an inward-pointing surface normal that
 * is neutral (128) in the centre and ramps to the extremes within `bevel` px of
 * each edge (smoothstepped). feDisplacementMap then bends the backdrop most at
 * the borders — the convex-lens refraction real glass has.
 */
function makeEdgeBevelMap(w: number, h: number, bevel: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tx = 1 - Math.min(1, Math.min(x, w - 1 - x) / bevel);
      const ty = 1 - Math.min(1, Math.min(y, h - 1 - y) / bevel);
      const sx = tx * tx * (3 - 2 * tx); // smoothstep
      const sy = ty * ty * (3 - 2 * ty);
      const nx = (x < w / 2 ? 1 : -1) * sx;
      const ny = (y < h / 2 ? 1 : -1) * sy;
      const i = (y * w + x) * 4;
      img.data[i] = 128 + nx * 127;
      img.data[i + 1] = 128 + ny * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

onMounted(() => {
  // Sized to the navbar's rough footprint so the stretched bevel stays even.
  glassMap.value = makeEdgeBevelMap(1024, 72, 22);
});
</script>
