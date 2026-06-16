import {
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue'
import type { RendererAdapter, Unsubscribe } from '@fari-brussels/viewer-core'

export interface LayerStatus {
  /** True while the layer is (re)loading. */
  loading: Ref<boolean>
  /** Last load error message, or null. */
  error: Ref<string | null>
  /** Feature count from the most recent successful load (0 for non-feature layers). */
  featureCount: Ref<number>
}

/**
 * Track one layer's async load status via the renderer's `layerStatus` events —
 * the renderer-agnostic way to show a spinner / error for layers loaded off the
 * main thread (tilesets, realtime feeds). Pair with {@link useLayer} /
 * {@link useLayers}, which manage the layer itself.
 */
export function useLayerStatus(
  viewer: ShallowRef<RendererAdapter | null>,
  layerId: MaybeRefOrGetter<string | null | undefined>,
): LayerStatus {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const featureCount = ref(0)

  let off: Unsubscribe | null = null

  watch(
    () => viewer.value,
    (v) => {
      off?.()
      off = null
      if (!v) return
      off = v.on('layerStatus', (e) => {
        if (e.id !== toValue(layerId)) return
        loading.value = e.status === 'loading'
        if (e.status === 'error') error.value = e.error ?? 'Failed to load'
        if (e.status === 'loaded') {
          error.value = null
          featureCount.value = e.featureCount ?? 0
        }
      })
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    off?.()
    off = null
  })

  return { loading, error, featureCount }
}
