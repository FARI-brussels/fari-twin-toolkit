# @fari-brussels/geo-ingest

Node geospatial ingestion primitives for the FARI Twin Toolkit. Generalizes the
one-off preprocessing scripts from BrusselsMigration into a clean, tested library
that produces toolkit wire types (`@fari-brussels/twin-types`): `Feature`,
`FeatureCollection`, `Place`.

## Install

```bash
pnpm add @fari-brussels/geo-ingest
```

## What's here (v0.1)

Pure, offline, fully unit-tested:

- **Reprojection** (`proj4`): `reprojectPosition`, `reprojectGeometry`,
  `reprojectFeature`, `reprojectFeatureCollection`, plus `CRS` presets
  (`WGS84`, `WEB_MERCATOR`, `LAMBERT72` = EPSG:31370, `ETRS89_LAEA` = EPSG:3035)
  and `registerCrs` for anything else.
- **Geometry**: `pointInPolygon` / `pointInGeometry` (ray casting, hole-aware),
  `bbox`, `centroid` (area-weighted).
- **Containment**: `findContainingFeature`, `assignCode` — tag points
  (buildings, permits, sensors) with the area (commune/district) they fall in.
- **Places**: `featureToPlace` / `featuresToPlaces` — map GeoJSON features to
  `Place` records with id/name/code/kind, optional bbox + centroid.

Readers (implemented; integration-level):

- **Shapefile**: `readShapefile(path, { from, to })` -> `FeatureCollection`,
  optionally reprojected (Shapefiles carry no CRS).
- **Excel**: `readExcelTable(pathOrBuffer, { sheet, range })` -> row objects.

## Example

```ts
import { readShapefile, featuresToPlaces, assignCode, CRS } from '@fari-brussels/geo-ingest'

// Belgian Lambert72 admin units -> WGS84 Places
const communes = await readShapefile('UrbISAdminUnits_Municipalities.shp', {
  from: CRS.LAMBERT72,
  to: CRS.WGS84,
})
const places = featuresToPlaces(communes, {
  kind: 'municipality',
  idProp: 'NISCODE',
  nameProp: 'NAME',
  codeProp: 'NISCODE',
  computeCentroid: true,
})

// tag a building by the commune it sits in
const nis = assignCode([4.3517, 50.8503], communes, 'NISCODE')
```

## Not here yet (deferred)

Network / format-specific converters, to layer on next:

- `geocode` (Nominatim, rate-limited + cached)
- `fetchOsmBuildings` (Overpass)
- `parseGml` (GML -> GeoJSON)

## Test

```bash
pnpm --filter @fari-brussels/geo-ingest test
```
