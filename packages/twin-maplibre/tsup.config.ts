import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/ui.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    'vue',
    'maplibre-gl',
    '@fari-brussels/viewer-core',
    '@fari-brussels/viewer-vue',
    '@fari-brussels/viewer-maplibre',
    '@fari-brussels/twin-ui-vue',
  ],
})
