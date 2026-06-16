import {
  onScopeDispose,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue'
import type { LayerHandle, LayerSpec, RendererAdapter } from '@fari-brussels/viewer-core'

/**
 * Reconcile a reactive array of layers against the viewer, keyed by `id`:
 * adds new layers, updates changed ones, removes those no longer present.
 */
export function useLayers(
  viewer: ShallowRef<RendererAdapter | null>,
  ready: Ref<boolean>,
  layers: MaybeRefOrGetter<LayerSpec[]>,
): void {
  const handles = new Map<string, LayerHandle>()

  watch(
    [() => viewer.value, () => ready.value, () => toValue(layers)],
    () => {
      const v = viewer.value
      if (!v || !ready.value) return
      const next = toValue(layers) ?? []
      const nextIds = new Set(next.map((l) => l.id))

      for (const [id, handle] of handles) {
        if (!nextIds.has(id)) {
          v.removeLayer(handle)
          handles.delete(id)
        }
      }
      for (const spec of next) {
        const existing = handles.get(spec.id)
        if (existing) v.updateLayer(existing, spec)
        else handles.set(spec.id, v.addLayer(spec))
      }
    },
    { deep: true, immediate: true },
  )

  onScopeDispose(() => {
    const v = viewer.value
    if (v) for (const handle of handles.values()) v.removeLayer(handle)
    handles.clear()
  })
}
