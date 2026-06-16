# @fari-brussels/viewer-maplibre

[MapLibre GL](https://maplibre.org/) adapter for
[`@fari-brussels/viewer-core`](../viewer-core). A fast, lightweight **2D** renderer for the
`RendererAdapter` contract — ideal for choropleths and dense point layers
(air-quality measurements, traffic sensors) where you want crisp interaction and
animated transitions without the WebGL weight of a 3D globe.

Covers the layer kinds `geojson`, `wms`, and `realtime`. For `tileset3d`,
`mesh3d`, or `pointcloud` use [`@fari-brussels/viewer-cesium`](../viewer-cesium) — both
implement the same contract, so app code is identical and capability negotiation
(`selectAdapter`) picks the right one.

`maplibre-gl` is a **peer dependency** — the consuming app installs and bundles
it (and imports its CSS).

## Usage

```ts
import { MapLibreAdapter, maplibreDescriptor } from '@fari-brussels/viewer-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css' // once, in the app

const viewer = new MapLibreAdapter()
await viewer.mount(document.getElementById('map')!, {
  basemap: { kind: 'osm' },
  initialCamera: { bbox: [4.24, 50.76, 4.48, 50.91] }, // Brussels
})

viewer.addLayer({
  id: 'no2',
  kind: 'geojson',
  data: noiseFeatureCollection,
  style: {
    pointRadius: 6,
    strokeColor: '#ffffff',
    colorBy: {
      property: 'no2',
      mode: 'step', // threshold legend: green within the norm, red over it
      stops: [
        { value: 0, color: '#00ff00' },
        { value: 40, color: '#ff0000' },
      ],
    },
  },
})

viewer.on('click', (pick) => console.log(pick.position, pick.properties))
```

### Animated recolour

Changing a layer's `colorBy` (e.g. switching the active norm) is a one-liner, and
MapLibre transitions the paint on the GPU — every point recolours in a single
animated pass, no per-feature work in JS:

```ts
viewer.updateLayer(handle, {
  style: { ...style, colorBy: { ...style.colorBy, stops: whoStops } },
})
```

## How a GeoJSON spec maps to MapLibre

One `geojson` LayerSpec becomes **one source** plus up to **three sub-layers**,
filtered by geometry type, so a single spec can mix points, polygons and lines:

| Sub-layer    | Geometry                  | Paint from `StyleSpec`                         |
| ------------ | ------------------------- | ---------------------------------------------- |
| `id__circle` | Point / MultiPoint        | `pointColor`/`colorBy`, `pointRadius`, strokes |
| `id__fill`   | Polygon / MultiPolygon    | `fillColor`/`colorBy`, `fillOpacity`           |
| `id__line`   | LineString + polygon edge | `strokeColor`, `strokeWidth`                   |

The spec → paint mapping lives in [`paint.ts`](./src/paint.ts) — pure, free of
any `maplibre-gl` import, and unit-tested. `colorBy` becomes a MapLibre
`interpolate` (gradient) or `step` (threshold) expression, mirroring
viewer-core's `colorRampAt` so MapLibre and Cesium agree on every colour.

## Status

- Pure paint mapping is unit-tested (`test/paint.test.ts`).
- **Runtime verification happens in the browser** (it needs WebGL) — next step is
  wiring this adapter into `@fari-brussels/playground` alongside the Cesium one.
- `updateLayer` updates GeoJSON sources/paint **in place** (animated); other
  layer kinds rebuild.

## Notes for the consuming app

Import the stylesheet once: `import 'maplibre-gl/dist/maplibre-gl.css'`. No build
plugin or static-asset copying is required (unlike Cesium).
