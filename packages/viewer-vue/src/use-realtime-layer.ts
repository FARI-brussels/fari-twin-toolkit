import {
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue'
import type {
  LayerHandle,
  RealtimeLayerSpec,
  RendererAdapter,
  Unsubscribe,
} from '@fari-brussels/viewer-core'

export interface RealtimeLayerStatus {
  /** True while a (re)fetch is in flight. */
  loading: Ref<boolean>
  /** Last load error message, or null. */
  error: Ref<string | null>
  /** Feature count from the most recent successful load. */
  featureCount: Ref<number>
}

/**
 * Manage a single realtime layer reactively and surface its load status.
 *
 * Reconciles the layer like {@link useLayer} (add once ready, update on change,
 * remove on cleanup / null spec) while subscribing to the renderer's
 * `layerStatus` events to expose `loading` / `error` / `featureCount` — the
 * renderer-agnostic replacement for the DT's bespoke realtime composable.
 *
 * Use a **stable `spec.id`** and vary `fetchFeatures` / `styleFeature` /
 * `sourceKind` per dataset: an id change can't be applied through `updateLayer`
 * (ids are immutable), whereas a content change re-fetches in place.
 */
export function useRealtimeLayer(
  viewer: ShallowRef<RendererAdapter | null>,
  ready: Ref<boolean>,
  spec: MaybeRefOrGetter<RealtimeLayerSpec | null | undefined>,
): RealtimeLayerStatus {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const featureCount = ref(0)

  let handle: LayerHandle | null = null
  let offStatus: Unsubscribe | null = null

  const subscribe = (v: RendererAdapter) => {
    offStatus = v.on('layerStatus', (e) => {
      const s = toValue(spec)
      if (!s || e.id !== s.id) return
      loading.value = e.status === 'loading'
      if (e.status === 'error') error.value = e.error ?? 'Failed to load'
      if (e.status === 'loaded') {
        error.value = null
        featureCount.value = e.featureCount ?? 0
      }
    })
  }

  watch(
    [() => viewer.value, () => ready.value, () => toValue(spec)],
    () => {
      const v = viewer.value
      if (!v || !ready.value) return
      if (!offStatus) subscribe(v)
      const s = toValue(spec)
      if (!s) {
        if (handle) {
          v.removeLayer(handle)
          handle = null
        }
        loading.value = false
        error.value = null
        featureCount.value = 0
        return
      }
      if (handle) v.updateLayer(handle, s)
      else handle = v.addLayer(s)
    },
    { deep: true, immediate: true },
  )

  onScopeDispose(() => {
    offStatus?.()
    offStatus = null
    const v = viewer.value
    if (v && handle) v.removeLayer(handle)
    handle = null
  })

  return { loading, error, featureCount }
}
