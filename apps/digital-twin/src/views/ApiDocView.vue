<script setup lang="ts">
import { onMounted } from 'vue';

// ============================================================================
// Types
// ============================================================================

interface RedocOptions {
  scrollYOffset: number;
  hideDownloadButton: boolean;
}

interface Redoc {
  init: (specUrl: string, options: RedocOptions, element: HTMLElement | null) => void;
}

declare global {
  interface Window {
    Redoc: Redoc;
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  // Add Redoc script if not already present
  if (!document.getElementById('redoc-script')) {
    const script = document.createElement('script');
    script.id = 'redoc-script';
    script.src = 'https://unpkg.com/redoc@latest/bundles/redoc.standalone.js';
    script.onload = renderRedoc;
    document.body.appendChild(script);
  } else {
    renderRedoc();
  }

  function renderRedoc(): void {
    // URL to OpenAPI/Swagger file (YAML or JSON)
    window.Redoc.init(
      '/openapi.yaml',
      {
        scrollYOffset: 50,
        hideDownloadButton: true,
      },
      document.getElementById('redoc-container')
    );
  }
});
</script>

<template>
  <div>
    <div id="redoc-container"></div>
  </div>
</template>
