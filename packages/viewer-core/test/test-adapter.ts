import { BaseAdapter } from '../src/base-adapter'
import type {
  BasemapSpec,
  CameraTarget,
  FlyOptions,
  LayerKind,
  LayerSpec,
  ViewerOpts,
} from '../src/layer-spec'

/** In-memory adapter that records hook calls — for exercising the contract. */
export class TestAdapter extends BaseAdapter {
  readonly name = 'test'
  readonly capabilities: ReadonlySet<LayerKind>

  added: LayerSpec[] = []
  removed: LayerSpec[] = []
  updated: Array<{ next: LayerSpec; prev: LayerSpec }> = []
  basemaps: Array<BasemapSpec | null> = []
  flights: CameraTarget[] = []
  mounted = false
  destroyed = false

  constructor(capabilities: LayerKind[] = ['geojson', 'wms', 'tileset3d', 'realtime']) {
    super()
    this.capabilities = new Set(capabilities)
  }

  protected async onMount(_container: HTMLElement, _opts: ViewerOpts): Promise<void> {
    this.mounted = true
  }
  protected onDestroy(): void {
    this.destroyed = true
  }
  protected onAddLayer(spec: LayerSpec): void {
    this.added.push(spec)
  }
  protected onUpdateLayer(next: LayerSpec, prev: LayerSpec): void {
    this.updated.push({ next, prev })
  }
  protected onRemoveLayer(spec: LayerSpec): void {
    this.removed.push(spec)
  }
  protected onSetBasemap(spec: BasemapSpec | null): void {
    this.basemaps.push(spec)
  }
  protected async onFlyTo(target: CameraTarget, _opts: FlyOptions): Promise<void> {
    this.flights.push(target)
  }
}

export const fakeElement = {} as unknown as HTMLElement
