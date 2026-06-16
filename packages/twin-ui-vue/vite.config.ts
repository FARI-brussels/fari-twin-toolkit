import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.json',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['test/**/*', '**/*.config.ts'],
    }),
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // keep peer/workspace deps out of the bundle
      external: ['vue', '@fari-brussels/twin-ui-tokens', '@fari-brussels/twin-ui-icons'],
    },
  },
})
