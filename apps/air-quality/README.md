# @fari-brussels/air-quality

**Brussels air quality** — the second real app on the FARI Twin Toolkit, and the
one that proves the renderer-agnostic promise: it renders with **MapLibre**
(`viewer-maplibre`) through the exact same `viewer-vue` / `viewer-core` API that
`brussels-twin` drives with Cesium. App code never imports `maplibre-gl`; it
hands `LayerSpec`s to `<TwinViewer>` and the adapter does the rest.

A reconstruction of [demo-fari-air-quality](https://github.com/FARI-brussels/demo-fari-air-quality),
rebuilt as a polished 2D point map with animated transitions.

```bash
pnpm install
pnpm --filter @fari-brussels/air-quality dev      # http://localhost:5182
pnpm --filter @fari-brussels/air-quality build    # production build (verifies the MapLibre bundle)
```

## What this demo shows

- **Point map of NO₂ measurements** — `viewer-vue` + `viewer-maplibre` render a
  GeoJSON layer of thousands of measurement points, coloured by concentration.
- **Animated recolour** — switch the reference norm (Measured / EU limit / EU
  2030 / WHO) and every point re-tints in a single GPU paint transition. No
  remove-and-re-add: the layer keeps a **stable id**, so `viewer-vue`'s
  `useLayers` routes the change through `updateLayer` → MapLibre
  `setPaintProperty`, which animates for free.
- **Source switching** — flip between measurement campaigns (CurieuzenAir /
  ExpAIR / IRCEL stations); the data set cross-fades via `setData` in place.
- **Spotlight framing** — the Brussels region is outlined in lighthouse teal and
  everything outside it is dimmed by a mask polygon (a world rectangle with the
  region punched out as a hole — no turf dependency). The camera flies to the
  region bbox on load.
- **Click-to-inspect** — click a point and a detail panel slides up with the
  value, a "within / over the limit" verdict against the active norm, the
  source-specific properties, and coordinates.
- **Stepped legend** — bands are derived from the active norm's `ColorStop`s, so
  the legend and the map are always coloured by the same source of truth.

## How the renderer stays invisible

The whole map is three `LayerSpec`s with stable ids (`MapView.vue`):

| id             | kind      | what it is                                             |
| -------------- | --------- | ------------------------------------------------------ |
| `mask`         | `geojson` | dim everything outside Brussels (world ring + hole)    |
| `boundary`     | `geojson` | the region outline, stroke only                        |
| `measurements` | `geojson` | the NO₂ points, `colorBy` in `step` mode from the norm |

The norm's thresholds are passed as `colorBy: { property: 'value', mode: 'step',
stops }`. `viewer-core` turns that into a step ramp; `viewer-maplibre` compiles
the same stops into a MapLibre `step` expression. The Cesium adapter honours the
identical `mode: 'step'`, so **the choice of renderer never changes the
science** — only the GPU path.

## Data

Data is data, not code — the measurement files are served as static assets from
`public/data/`, never inlined into source. Three NO₂ data sets and the region
boundary live there:

```
public/data/
  no2_curieusenair.json                 CurieuzenAir citizen-science campaign (~2.5k points)
  no2_expair.json                       ExpAIR mobile-sensor campaign
  no2_anmean_station_brussels2023.json  IRCEL/CELINE official stations, 2023 annual mean
  brussels_boundary.geojson             Brussels-Capital region polygon (CRS84)
```

`src/data/load.ts` fetches the active source, copies its pollutant property to a
canonical `value` field, drops non-finite / below-threshold readings, and
computes count / min / max for the legend. `FeatureCollection`s are `markRaw`'d
so Vue's deep-watch never traverses thousands of features each tick.

The data is identical to the original demo. Swapping in a live source (Directus,
a tiled heatmap) is a change to `sources.ts` + `load.ts` only — the map,
controls and legend follow.

## Layout

```
src/
  data/
    sources.ts     measurement campaigns (file, value property, point radius)
    norms.ts       NO₂ colour ramps as viewer-core ColorStop[] (step mode)
    load.ts        fetch + normalize a source (cached); markRaw the collection
    boundary.ts    region outline + spotlight mask + bbox (cached)
  components/
    MapView.vue    TwinViewer + MapLibreAdapter; the three stable-id layers
    Controls.vue   segmented source / norm selectors
    Legend.vue     stepped bands derived from the active norm + live stats
    DetailPanel.vue slide-up inspector for the selected point
    HeaderBar.vue  translucent title overlay
  state.ts         reactive { sourceId, normId, selected, stats, loading }
  App.vue          shell: full-bleed map + floating control rail
```

## Extracting later

Like `brussels-twin`, this lives in the monorepo for fast iteration but is
self-contained. To extract: copy the directory, swap `workspace:*` for published
versions, and `import 'maplibre-gl/dist/maplibre-gl.css'` in your entry (already
done in `src/main.ts`).
