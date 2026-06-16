import { defineComponent, h, type PropType } from 'vue'
import type {
  BasemapSpec,
  CameraTarget,
  LayerSpec,
  PickResult,
  RendererAdapter,
} from '@fari-brussels/viewer-core'
import { useViewer } from './use-viewer'
import { useLayers } from './use-layers'

/**
 * Drop-in viewer component. Give it an adapter factory and a reactive list of
 * layers; it owns the container element and the adapter lifecycle.
 *
 * ```vue
 * <TwinViewer :adapter="() => new CesiumAdapter()" :layers="layers"
 *   :basemap="{ kind: 'osm' }" @pick="onPick" @ready="onReady" />
 * ```
 *
 * Exposes `{ viewer, ready, error }` via a template ref for imperative access.
 */
export const TwinViewer = defineComponent({
  name: 'TwinViewer',
  props: {
    adapter: { type: Function as PropType<() => RendererAdapter>, required: true },
    layers: { type: Array as PropType<LayerSpec[]>, default: () => [] },
    basemap: { type: Object as PropType<BasemapSpec | null>, default: undefined },
    camera: { type: Object as PropType<CameraTarget>, default: undefined },
  },
  emits: {
    ready: () => true,
    pick: (_pick: PickResult) => true,
    error: (_error: Error) => true,
  },
  setup(props, { emit, expose }) {
    const { containerRef, viewer, ready, error } = useViewer(props.adapter, {
      basemap: props.basemap,
      initialCamera: props.camera,
      onReady: () => emit('ready'),
      onPick: (pick) => emit('pick', pick),
      onError: (err) => emit('error', err),
    })

    useLayers(viewer, ready, () => props.layers)

    expose({ viewer, ready, error })

    return () =>
      h('div', {
        ref: containerRef,
        class: 'twin-viewer',
        style: { width: '100%', height: '100%' },
      })
  },
})

export default TwinViewer
