# End-to-end walkthrough

This builds a small socio-economic twin of Brussels — the kind of thing
BrusselsMigration does — using every package together. The shape is general:
**ingest geodata → typed Places → attach indicator timeseries → render a
choropleth styled with brand colors → interact.**

```
shapefile (.shp)            Excel (.xlsx)
      │ geo-ingest               │ geo-ingest
      ▼                          ▼
   Place[]  ◀── twin-types ──▶  Timeseries[]
      │                          │
      └──────────┬───────────────┘
                 ▼  join latest value onto each feature
          FeatureCollection
                 │ viewer-core (LayerSpec + colorBy)
                 ▼
        viewer-cesium  ── styled with ──▶ twin-ui-tokens
```

Each step lists the package it uses, so you can also read this as "what does
package X do on its own".

## 1. Ingest boundaries → `Place[]`

::: tip Package
`@fari-brussels/geo-ingest` + `@fari-brussels/twin-types`
:::

UrbIS publishes Brussels boundaries as a Belgian Lambert-72 shapefile. Read it,
reproject to WGS84, and map each feature to a typed `Place`.

```ts
import { readShapefile, featuresToPlaces, CRS } from '@fari-brussels/geo-ingest'
import type { Place } from '@fari-brussels/twin-types'

const communes = await readShapefile('data/communes.shp', {
  from: CRS.LAMBERT72, // EPSG:31370
  to: CRS.WGS84, // EPSG:4326
})

const places: Place[] = featuresToPlaces(communes, {
  kind: 'municipality',
  idProp: 'NISCODE',
  nameProp: 'NAME_FR',
  codeProp: 'NISCODE',
  computeCentroid: true,
})
// places[0] -> { id: '21004', name: 'Bruxelles', kind: 'municipality',
//                code: '21004', geometry: {...}, centroid: {...} }
```

## 2. Read indicators → `Timeseries[]`

::: tip Package
`@fari-brussels/geo-ingest` (Excel) + `@fari-brussels/twin-types`
:::

Define the indicator's metadata, then turn each spreadsheet row (one commune,
one column per year) into a `Timeseries`.

```ts
import { readExcelTable } from '@fari-brussels/geo-ingest'
import type { Indicator, Timeseries } from '@fari-brussels/twin-types'

const unemployment: Indicator = {
  key: 'unemployment_rate',
  label: 'Unemployment rate',
  unit: '%',
  category: 'socioeconomic',
  higher_is_better: false, // drives color-scale direction later
}

const rows = readExcelTable('data/unemployment.xlsx', { sheet: 'rates' })
// rows: [{ niscode: '21004', '2020': 14.1, '2021': 13.8, '2022': 13.2 }, ...]

const series: Timeseries[] = rows.map((row) => ({
  place_id: String(row.niscode),
  indicator_key: unemployment.key,
  points: Object.entries(row)
    .filter(([key]) => /^\d{4}$/.test(key)) // year columns
    .map(([period, value]) => ({ period, value: Number(value) })),
}))
```

## 3. Share the contract with the backend

::: tip Package
`fari-twin-types` (Python)
:::

`Place`, `Indicator` and `Timeseries` are generated from the **same**
`specs/openapi.yaml`, so a FastAPI backend speaks the identical shape — no
hand-written DTOs, no drift:

```python
from fari_twin_types import Place, Indicator, Timeseries

place = Place(id="21004", name="Bruxelles", kind="municipality", code="21004")
place.model_dump_json(exclude_none=True)  # snake_case wire format
```

## 4. Build the choropleth `FeatureCollection`

Join the latest value of the indicator onto each commune's properties. (Plain
data work — no toolkit package needed.)

```ts
const latestByPlace = new Map(series.map((s) => [s.place_id, s.points.at(-1)?.value ?? null]))

const choropleth = {
  type: 'FeatureCollection' as const,
  features: places
    .filter((p) => p.geometry)
    .map((p) => ({
      type: 'Feature' as const,
      geometry: p.geometry!,
      properties: { name: p.name, code: p.code, value: latestByPlace.get(p.id) },
    })),
}
```

## 5. Render it — styled with brand colors

::: tip Package
`@fari-brussels/viewer-core` + `@fari-brussels/viewer-cesium` + `@fari-brussels/twin-ui-tokens`
:::

Pick a renderer that can draw what this screen needs, mount it, and add a
GeoJSON layer colored by the `value` property using a FARI color ramp.

```ts
import { selectAdapter } from '@fari-brussels/viewer-core'
import { cesiumDescriptor } from '@fari-brussels/viewer-cesium'
import { tokens } from '@fari-brussels/twin-ui-tokens'

// "give me the lightest renderer that can draw geojson"
const descriptor = selectAdapter([cesiumDescriptor], ['geojson'])!
const viewer = descriptor.create()

await viewer.mount(document.getElementById('map')!, { basemap: { kind: 'osm' } })

viewer.addLayer({
  id: 'unemployment',
  kind: 'geojson',
  data: choropleth,
  style: {
    // higher_is_better === false → teal (good/low) ramps to red (bad/high)
    colorBy: {
      property: 'value',
      stops: [
        { value: 5, color: tokens.brandColors.lighthouseBlue }, // #64D8BF
        { value: 20, color: tokens.statusColors.notOk }, // #B32A2D
      ],
    },
    strokeColor: tokens.brandColors.blue,
    strokeWidth: 1,
  },
})

await viewer.flyTo({ bbox: [4.25, 50.79, 4.45, 50.91] }) // fit Brussels

viewer.on('click', (pick) => {
  console.log(pick.featureId, pick.properties) // e.g. { name, code, value }
})
```

The app never imported Cesium. Swap `cesiumDescriptor` for a future
`maplibreDescriptor` and, as long as it supports `geojson`, nothing else changes.

## 6. Add 3D when you need it

Need the city in 3D? The same viewer handle takes a 3D Tiles layer — and because
`tileset3d` is a capability only some renderers have, `selectAdapter` will route
you to Cesium automatically:

```ts
const descriptor = selectAdapter(
  [leafletDescriptor, cesiumDescriptor],
  [
    'geojson',
    'tileset3d', // forces a 3D-capable renderer
  ],
)!

viewer.addLayer({ id: 'city', kind: 'tileset3d', url: 'https://…/tileset.json' })
```

## What each package contributed

| Step | Package                         | Did                                                    |
| ---- | ------------------------------- | ------------------------------------------------------ |
| 1    | `@fari-brussels/geo-ingest`     | reproject + shapefile → `Place[]`                      |
| 2    | `@fari-brussels/geo-ingest`     | Excel → `Timeseries[]`                                 |
| 1–4  | `@fari-brussels/twin-types`     | the shared `Place` / `Indicator` / `Timeseries` shapes |
| 3    | `fari-twin-types`               | identical models on the Python backend                 |
| 5–6  | `@fari-brussels/viewer-core`    | `LayerSpec`, `colorBy`, renderer selection             |
| 5–6  | `@fari-brussels/viewer-cesium`  | actually drew it on a globe                            |
| 5    | `@fari-brussels/twin-ui-tokens` | brand colors for the ramp + stroke                     |

See it running in the [playground](https://github.com/FARI-brussels/fari-twin-toolkit/tree/main/apps/playground)
(`pnpm --filter @fari-brussels/playground dev` → the **Map** tab).
