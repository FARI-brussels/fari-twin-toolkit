/**
 * `@fari-brussels/twin-cesium` — the batteries-included entry for a Cesium + Vue digital
 * twin. Re-exports the whole viewer stack so apps import from one place:
 *
 * ```ts
 * import { useViewer, TwinViewer, CesiumAdapter, gradientLegend } from '@fari-brussels/twin-cesium'
 * ```
 *
 * UI components live on the `./ui` subpath; the renderer runtime (`cesium`) and
 * `vue` are peer dependencies you install yourself. Prefer the granular packages
 * (`@fari-brussels/viewer-core`, …) when you want a minimal footprint.
 */
export * from '@fari-brussels/viewer-core'
export * from '@fari-brussels/viewer-vue'
export * from '@fari-brussels/viewer-cesium'
