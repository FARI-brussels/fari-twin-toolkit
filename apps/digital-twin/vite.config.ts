import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Port 5173 (Vite's default) matches the origin the upstream repo runs on, so the
  // shared Keycloak `development-no-use-in-prod` client already whitelists it as a
  // valid redirect URI — avoiding the "Invalid parameter: redirect_uri" 400 that a
  // non-whitelisted port (e.g. 5183) triggers on the live keycloak.digitaltwin.brussels.
  server: { port: 5173, open: true },
})
