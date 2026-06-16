import type { LayerHandle, RendererAdapter, Unsubscribe, ViewerEventMap } from './adapter'
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
import { assertSupported } from './capabilities'
import { DuplicateLayerError, LayerNotFoundError } from './errors'
import { Emitter } from './emitter'

/**
 * Base class that handles the bookkeeping every adapter needs — layer registry,
 * id/duplicate/capability checks, event emission — so a concrete renderer only
 * implements the `on*` hooks. This makes "add a new renderer" fill-in-the-blanks.
 */
export abstract class BaseAdapter implements RendererAdapter {
  abstract readonly name: string
  abstract readonly capabilities: ReadonlySet<LayerKind>

  protected readonly emitter = new Emitter<ViewerEventMap>()
  private readonly specs = new Map<string, LayerSpec>()
  /** Remembered so `resetCamera` can return to it. */
  private initialCamera?: CameraTarget
  /**
   * Guards against double-teardown (e.g. an unmount racing an async mount). A
   * JS-private field so it never collides with a subclass's own `destroyed`.
   */
  #destroyed = false

  /** True once `destroy()` has run; renderers use it to bail out of async work. */
  protected get isDestroyed(): boolean {
    return this.#destroyed
  }

  // --- hooks a concrete renderer must implement ---
  protected abstract onMount(container: HTMLElement, opts: ViewerOpts): Promise<void>
  protected abstract onDestroy(): void
  protected abstract onAddLayer(spec: LayerSpec): void
  protected abstract onUpdateLayer(next: LayerSpec, prev: LayerSpec): void
  protected abstract onRemoveLayer(spec: LayerSpec): void
  protected abstract onSetBasemap(spec: BasemapSpec | null): void
  protected abstract onFlyTo(target: CameraTarget, opts: FlyOptions): Promise<void>

  async mount(container: HTMLElement, opts: ViewerOpts = {}): Promise<void> {
    await this.onMount(container, opts)
    if (this.#destroyed) return // unmounted while mounting
    if (opts.basemap !== undefined) this.onSetBasemap(opts.basemap)
    if (opts.initialCamera) {
      this.initialCamera = opts.initialCamera
      // Place the camera instantly on first paint — no gratuitous fly-in.
      await this.onFlyTo(opts.initialCamera, { durationMs: 0 })
      if (this.#destroyed) return
    }
    this.emitter.emit('ready', undefined)
  }

  destroy(): void {
    if (this.#destroyed) return
    this.#destroyed = true
    for (const spec of this.specs.values()) this.onRemoveLayer(spec)
    this.specs.clear()
    this.onDestroy()
    this.emitter.clear()
  }

  addLayer(spec: LayerSpec): LayerHandle {
    assertSupported(this, spec.kind)
    if (this.specs.has(spec.id)) throw new DuplicateLayerError(spec.id)
    this.specs.set(spec.id, spec)
    this.onAddLayer(spec)
    return { id: spec.id }
  }

  updateLayer(handle: LayerHandle, patch: Partial<LayerSpec>): void {
    const prev = this.specs.get(handle.id)
    if (!prev) throw new LayerNotFoundError(handle.id)
    // id and kind are immutable for an existing layer.
    const next = { ...prev, ...patch, id: prev.id, kind: prev.kind } as LayerSpec
    this.specs.set(handle.id, next)
    this.onUpdateLayer(next, prev)
  }

  removeLayer(handle: LayerHandle): void {
    const spec = this.specs.get(handle.id)
    if (!spec) return
    this.specs.delete(handle.id)
    this.onRemoveLayer(spec)
  }

  setBasemap(spec: BasemapSpec | null): void {
    this.onSetBasemap(spec)
  }

  flyTo(target: CameraTarget, opts: FlyOptions = {}): Promise<void> {
    return this.onFlyTo(target, opts)
  }

  // --- camera nudges ---
  // Defaults below are safe no-ops/null so every adapter satisfies the contract;
  // a renderer overrides the ones it can honor. `resetCamera` is implemented here
  // for all renderers — it simply re-flies to the mounted `initialCamera`.

  /** Override in a renderer that supports incremental zoom. Default: no-op. */
  zoomBy(_factor: number): void {}

  /** Override in a renderer that supports incremental rotation. Default: no-op. */
  rotateBy(_deltaDegrees: number, _opts: RotateOptions = {}): void {}

  resetCamera(opts: FlyOptions = {}): Promise<void> {
    if (!this.initialCamera) return Promise.resolve()
    return this.onFlyTo(this.initialCamera, opts)
  }

  /** Override in a renderer that exposes interaction toggles. Default: no-op. */
  configureControls(_opts: CameraControlOptions): void {}

  /** Override in a renderer that can read its camera. Default: null. */
  getCameraState(): CameraState | null {
    return null
  }

  /** Override in a renderer that can frame a layer's extent. Default: no-op. */
  frameLayer(_id: string, _opts: FrameOptions = {}): void {}

  on<E extends keyof ViewerEventMap>(
    event: E,
    handler: (payload: ViewerEventMap[E]) => void,
  ): Unsubscribe {
    return this.emitter.on(event, handler)
  }

  /** Ids of all currently-added layers. */
  listLayerIds(): string[] {
    return [...this.specs.keys()]
  }

  /** Current spec for a layer, if present. */
  protected getSpec(id: string): LayerSpec | undefined {
    return this.specs.get(id)
  }
}
