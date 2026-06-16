import { defineConfig } from 'tsup'

export default defineConfig({
  // A thin re-export bundle: keep the real packages external so consumers get
  // one copy of each (and tree-shaking still works).
  entry: ['src/index.ts', 'src/ui.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    'vue',
    'cesium',
    '@fari-brussels/viewer-core',
    '@fari-brussels/viewer-vue',
    '@fari-brussels/viewer-cesium',
    '@fari-brussels/twin-ui-vue',
  ],
})
