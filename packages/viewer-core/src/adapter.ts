import type {
  BasemapSpec,
  CameraControlOptions,
  CameraState,
  CameraTarget,
  FlyOptions,
  FrameOptions,
  LayerKind,
  LayerSpec,
  RotateOptions,
  ViewerOpts,
} from './layer-spec'

/** Opaque handle returned by addLayer; pass it back to update/remove. */
export interface LayerHandle {
  readonly id: string
}

export type Unsubscribe = () => void

/** Result of a click/hover pick. */
export interface PickResult {
  layerId?: string
  featureId?: string | number
  position?: { lon: number; lat: number; height?: number }
  properties?: Record<string, unknown>
}

/**
 * Lifecycle of an async (typically realtime) layer load. Lets the UI show a
 * spinner, a feature count, or an error without reaching into the renderer —
 * the renderer-agnostic counterpart of the DT's per-layer `loading` /
 * `featureCount` / `error` refs.
 */
export interface LayerStatusEvent {
  id: string
  status: 'loading' | 'loaded' | 'error'
  /** Feature count after a successful load. */
  featureCount?: number
  /** Message when `status === 'error'`. */
  error?: string
}

export interface ViewerEventMap {
  ready: void
  error: Error
  click: PickResult
  hover: PickResult
  layerStatus: LayerStatusEvent
}

/**
 * The single API every renderer implements. Application code depends only on
 * this — never on Cesium/MapLibre/Three directly.
 */
export interface RendererAdapter {
  readonly name: string
  readonly capabilities: ReadonlySet<LayerKind>

  mount(container: HTMLElement, opts?: ViewerOpts): Promise<void>
  destroy(): void

  addLayer(spec: LayerSpec): LayerHandle
  updateLayer(handle: LayerHandle, patch: Partial<LayerSpec>): void
  removeLayer(handle: LayerHandle): void

  setBasemap(spec: BasemapSpec | null): void
  flyTo(target: CameraTarget, opts?: FlyOptions): Promise<void>

  // --- camera nudges (renderer-agnostic) ---
  // `zoomBy`/`rotateBy`/`configureControls`/`getCameraState` are best-effort:
  // BaseAdapter provides safe defaults so a renderer that can't honor them still
  // satisfies the contract. `resetCamera` is universal — it re-flies to the
  // camera the viewer was mounted with.

  /** Zoom relative to the current height. Positive zooms in, negative out. */
  zoomBy(factor: number): void
  /** Turn the camera by a heading delta in degrees (positive = clockwise). */
  rotateBy(deltaDegrees: number, opts?: RotateOptions): void
  /** Fly back to the `initialCamera` the viewer was mounted with. */
  resetCamera(opts?: FlyOptions): Promise<void>
  /** Enable/disable the user-driven camera interactions. */
  configureControls(opts: CameraControlOptions): void
  /** Read the current camera position, or null if unavailable. */
  getCameraState(): CameraState | null
  /**
   * Frame the camera on a layer's 3D extent (e.g. a tileset's bounding sphere).
   * Best-effort: a no-op for layers/renderers without a meaningful extent.
   */
  frameLayer(id: string, opts?: FrameOptions): void

  on<E extends keyof ViewerEventMap>(
    event: E,
    handler: (payload: ViewerEventMap[E]) => void,
  ): Unsubscribe
}
