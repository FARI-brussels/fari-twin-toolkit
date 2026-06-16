/**
 * `@fari-brussels/twin-maplibre` — the batteries-included entry for a MapLibre + Vue
 * digital twin. Re-exports the whole viewer stack so apps import from one place:
 *
 * ```ts
 * import { useViewer, TwinViewer, MapLibreAdapter, gradientLegend } from '@fari-brussels/twin-maplibre'
 * ```
 *
 * UI components live on the `./ui` subpath; the renderer runtime (`maplibre-gl`)
 * and `vue` are peer dependencies you install yourself. Prefer the granular
 * packages (`@fari-brussels/viewer-core`, …) when you want a minimal footprint.
 */
export * from '@fari-brussels/viewer-core'
export * from '@fari-brussels/viewer-vue'
export * from '@fari-brussels/viewer-maplibre'
