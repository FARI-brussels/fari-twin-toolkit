# @fari-brussels/twin-types

TypeScript types for the FARI Twin Toolkit wire format. **Generated** from
`specs/openapi.yaml` — the same source of truth as the Python `fari-twin-types`
package, so the two never drift.

## Install

```bash
pnpm add -D @fari-brussels/twin-types
```

## Usage

```ts
import type { Place, Job, Scenario, FeatureCollection } from '@fari-brussels/twin-types'

const place: Place = { id: '21004', name: 'Bruxelles', kind: 'municipality' }
```

The raw generated surface is also available for advanced use:

```ts
import type { components, paths } from '@fari-brussels/twin-types'
type Indicator = components['schemas']['Indicator']
```

## What's in the contract

- **GeoJSON** (RFC 7946): `Point` … `MultiPolygon`, `Geometry` (discriminated
  union), `Feature`, `FeatureCollection`.
- **Resources** (reused/cleaned from fari-digital-twin-frontend): `Asset`,
  `Tileset`, `WmsLayer`, `RealtimeDataset`.
- **Places** (fresh): `Place`, `PlaceKind`.
- **Indicators** (fresh): `Indicator`, `Timeseries`, `IndicatorValue`.
- **Scenarios** (fresh): `Scenario`, `ScenarioOverride`, `ModelKind`.
- **Jobs** (fresh): `Job`, `JobStatus`, `JobResult`, `JobFile`.

`LayerSpec` (how a viewer draws these) intentionally lives in `@fari-brussels/viewer-core`,
not here.

## Regenerate

Generated files (`src/generated.ts`, `src/schemas.ts`) are committed; regenerate
when the spec changes:

```bash
pnpm generate   # openapi-typescript + named-alias generation
```

CI should run this and fail on any diff. Do not edit the generated files by hand.
