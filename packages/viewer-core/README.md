# @fari-brussels/viewer-core

The renderer-agnostic viewer contract for the FARI Twin Toolkit. Application code
describes **what** to draw (`LayerSpec`); an adapter decides **how**. This package
has no heavy dependencies — each renderer (Cesium, Three/Giro3D, MapLibre, …) is
a separate package that implements the contract here.

> Performance over consistency: pick the lightest renderer that can draw what a
> screen needs. The app never imports Cesium/MapLibre/Three directly.

## The contract

- **`LayerSpec`** — discriminated union over `geojson | wms | tileset3d |
realtime | mesh3d | pointcloud`.
- **`StyleSpec`** — declarative styling (fill/stroke/point/icon) + data-driven
  `colorBy` ramps. No renderer-specific callbacks.
- **`RendererAdapter`** — `mount / destroy / addLayer / updateLayer /
removeLayer / setBasemap / flyTo / on`.
- **`BaseAdapter`** — implements all the bookkeeping (layer registry, duplicate/
  capability/not-found checks, event emission); a renderer subclass only fills in
  the `on*` hooks.
- **Capabilities** — `supports`, `assertSupported`, and `selectAdapter` to choose
  the cheapest adapter that covers a screen's required layer kinds.
- **Mappers** — `layerFrom{WmsLayer,Tileset,RealtimeDataset,Asset}` bridge the
  wire format (`@fari-brussels/twin-types`, snake_case) to `LayerSpec` (camelCase).

## Writing an adapter

```ts
import { BaseAdapter, type LayerKind, type LayerSpec } from '@fari-brussels/viewer-core'

export class MyAdapter extends BaseAdapter {
  readonly name = 'my-renderer'
  readonly capabilities = new Set<LayerKind>(['geojson', 'wms'])

  protected async onMount(container, opts) {
    /* create the underlying viewer */
  }
  protected onAddLayer(spec: LayerSpec) {
    /* translate spec -> renderer primitive */
  }
  // ...the other on* hooks
}
```

## Selecting a renderer

```ts
import { selectAdapter } from '@fari-brussels/viewer-core'
import { cesiumDescriptor } from '@fari-brussels/viewer-cesium'

const chosen = selectAdapter([leafletDescriptor, cesiumDescriptor], ['geojson', 'tileset3d'])
const viewer = chosen!.create()
await viewer.mount(el)
```

## Test

```bash
pnpm --filter @fari-brussels/viewer-core test
```

The contract is exercised with an in-memory `TestAdapter` (no WebGL needed),
covering capability rejection, duplicate/missing-layer handling, update/remove
bookkeeping, events, color-ramp interpolation, and the wire-type mappers.
