# @fari-brussels/viewer-cesium

CesiumJS adapter for [`@fari-brussels/viewer-core`](../viewer-core). Implements the
`RendererAdapter` contract on a Cesium globe, covering every layer kind
(`geojson`, `wms`, `tileset3d`, `realtime`, `mesh3d`, `pointcloud`).

`cesium` is a **peer dependency** — the consuming app installs and bundles it
(e.g. with `vite-plugin-cesium`), so the WebGL weight is only paid where it's used.

## Usage

```ts
import { CesiumAdapter, cesiumDescriptor } from '@fari-brussels/viewer-cesium'

const viewer = new CesiumAdapter({ ionToken: import.meta.env.VITE_CESIUM_ION_TOKEN })
await viewer.mount(document.getElementById('map')!, { basemap: { kind: 'osm' } })

viewer.addLayer({ id: 'city', kind: 'tileset3d', url: 'https://…/tileset.json' })
viewer.addLayer({
  id: 'wards',
  kind: 'geojson',
  data: featureCollection,
  style: { fillColor: '#64D8BF' },
})
await viewer.flyTo({ center: { lon: 4.3517, lat: 50.8503 }, height: 4000 })

viewer.on('click', (pick) => console.log(pick.position, pick.properties))
```

Or let the toolkit choose the renderer:

```ts
import { selectAdapter } from '@fari-brussels/viewer-core'
import { cesiumDescriptor } from '@fari-brussels/viewer-cesium'

const chosen = selectAdapter([cesiumDescriptor], ['tileset3d'])
const viewer = chosen!.create()
```

## Status

- Compiles and typechecks against CesiumJS; the contract itself is unit-tested in
  `@fari-brussels/viewer-core`.
- **Runtime verification happens in the browser** (it needs WebGL) — next step is
  wiring this adapter into `@fari-brussels/playground`.
- `updateLayer` currently rebuilds the layer; per-property diffing is a later
  optimization.

## Notes for the consuming app

Cesium needs its static assets served and `window.CESIUM_BASE_URL` set. Use
`vite-plugin-cesium` (or copy `node_modules/cesium/Build/Cesium` and set the base
URL) in the app, not here.
