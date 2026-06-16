import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import type { PickResult, RendererAdapter, ViewerOpts } from '@fari-brussels/viewer-core'

export interface UseViewerOptions extends ViewerOpts {
  onReady?: () => void
  onPick?: (pick: PickResult) => void
  onError?: (error: Error) => void
}

export interface UseViewerReturn {
  /** Bind to the container element: `<div :ref="containerRef" />`. */
  containerRef: Ref<HTMLElement | null>
  /** The live adapter (null until mounted). */
  viewer: ShallowRef<RendererAdapter | null>
  ready: Ref<boolean>
  error: Ref<Error | null>
}

/**
 * Mount a renderer adapter into a container element and manage its lifecycle.
 * Client-only (uses onMounted) — in Nuxt, wrap the host component in
 * <ClientOnly>. Pass a factory so the (heavy) adapter is created lazily on mount.
 *
 * Teardown is defensive on purpose: mounting is async, so a route change can
 * unmount the host mid-mount. We flag disposal, ignore late events, bail the
 * mount, and swallow renderer teardown errors — an error escaping `onBeforeUnmount`
 * corrupts Vue's unmount and wedges the app (forcing a manual refresh).
 */
export function useViewer(
  factory: () => RendererAdapter,
  options: UseViewerOptions = {},
): UseViewerReturn {
  const containerRef = ref<HTMLElement | null>(null)
  const viewer = shallowRef<RendererAdapter | null>(null)
  const ready = ref(false)
  const error = ref<Error | null>(null)

  let adapter: RendererAdapter | null = null
  let disposed = false

  onMounted(async () => {
    if (!containerRef.value || disposed) return
    const a = factory()
    adapter = a
    viewer.value = a

    a.on('error', (e) => {
      if (disposed) return
      error.value = e
      options.onError?.(e)
    })
    a.on('ready', () => {
      if (disposed) return
      ready.value = true
      options.onReady?.()
    })
    if (options.onPick) {
      const onPick = options.onPick
      a.on('click', (p) => {
        if (!disposed) onPick(p)
      })
    }

    try {
      await a.mount(containerRef.value, {
        basemap: options.basemap,
        initialCamera: options.initialCamera,
      })
    } catch (e) {
      if (!disposed) {
        error.value = e as Error
        options.onError?.(e as Error)
      }
    }

    // Unmounted while mounting: tear the adapter down now (mount bailed early).
    if (disposed) {
      try {
        a.destroy()
      } catch {
        /* destroy is idempotent / viewer already gone */
      }
      if (viewer.value === a) viewer.value = null
    }
  })

  onBeforeUnmount(() => {
    disposed = true
    ready.value = false
    const a = adapter
    adapter = null
    // Null the ref first so dependent composables (useLayers, …) stop touching
    // the adapter before we tear it down.
    viewer.value = null
    if (a) {
      try {
        a.destroy()
      } catch (e) {
        console.warn('[useViewer] viewer destroy error (ignored)', e)
      }
    }
  })

  return { containerRef, viewer, ready, error }
}
