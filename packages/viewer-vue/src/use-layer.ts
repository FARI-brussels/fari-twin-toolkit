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
 * Keep a single layer in sync with a reactive spec. Adds it once the viewer is
 * ready, updates it when the spec changes, and removes it on cleanup or when the
 * spec becomes null.
 */
export function useLayer(
  viewer: ShallowRef<RendererAdapter | null>,
  ready: Ref<boolean>,
  spec: MaybeRefOrGetter<LayerSpec | null | undefined>,
): void {
  let handle: LayerHandle | null = null

  watch(
    [() => viewer.value, () => ready.value, () => toValue(spec)],
    () => {
      const v = viewer.value
      if (!v || !ready.value) return
      const s = toValue(spec)
      if (!s) {
        if (handle) {
          v.removeLayer(handle)
          handle = null
        }
        return
      }
      if (handle) v.updateLayer(handle, s)
      else handle = v.addLayer(s)
    },
    { deep: true, immediate: true },
  )

  onScopeDispose(() => {
    const v = viewer.value
    if (v && handle) v.removeLayer(handle)
    handle = null
  })
}
