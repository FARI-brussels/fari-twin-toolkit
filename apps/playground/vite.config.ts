import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  // cesium() copies Cesium's static assets and sets CESIUM_BASE_URL.
  plugins: [vue(), cesium()],
  server: { port: 5180, open: true },
})
