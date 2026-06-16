# Packages

Install only what a project needs. Every package is independently versioned and
published under the `@fari` scope (Python under `fari-`).

## `@fari-brussels/twin-types`

TypeScript types for the wire format, generated from `specs/openapi.yaml`:
GeoJSON, `Place`, `Indicator`, `Timeseries`, `Scenario`, `Job`, and the resource
types (`Asset`, `Tileset`, `WmsLayer`, `RealtimeDataset`).

```ts
import type { Place, Indicator, FeatureCollection } from '@fari-brussels/twin-types'
```

## `fari-twin-types` (Python)

Pydantic v2 models for the same wire format, generated from the same spec.

```python
from fari_twin_types import Place, Job, Scenario
```

## `@fari-brussels/twin-ui-tokens`

FARI brand tokens — colors, gradients, typography. TypeScript is the source of
truth; CSS variables and a Tailwind preset are generated from it.

```ts
import { tokens } from '@fari-brussels/twin-ui-tokens'
import '@fari-brussels/twin-ui-tokens/css' // --fari-* custom properties
```

```ts
// tailwind.config.ts
import fariPreset from '@fari-brussels/twin-ui-tokens/tailwind'
export default { presets: [fariPreset] }
```

## `@fari-brussels/twin-ui-icons`

The canonical FARI icon set (59 icons across navigation / interface / content /
user-system / feedback / demo) as tree-shakeable Vue 3 components. Monochrome
icons use `currentColor`, so they inherit text color and theme via the tokens.

```ts
import { IconSearch, IconUser, FariIcon } from '@fari-brussels/twin-ui-icons'
```

## `@fari-brussels/twin-ui-vue`

Vue 3 component library — primitives (`FButton` incl. a brand `gradient` variant,
`FSegmented`, `FCheckbox`, `FChip`, `FCard`, `FSwitch`, `FSlider`) and domain
widgets (`FYearSlider`, `FChoroplethLegend`) built on the tokens + icons. Scoped
CSS (no Tailwind required by consumers); Vite library-mode build with `.d.ts`.

```ts
import '@fari-brussels/twin-ui-vue/style.css'
import { FButton, FSegmented, FChip, FCard } from '@fari-brussels/twin-ui-vue'
```

## `@fari-brussels/geo-ingest`

Node geospatial ingestion: reprojection (`proj4`), shapefile/Excel readers,
point-in-polygon containment, `Feature` → `Place` mapping, and the
`joinIndicatorValues` helper that turns `Place[] + Timeseries[]` into a
`FeatureCollection` ready for `viewer-core`'s `colorBy`.

```ts
import {
  readShapefile,
  featuresToPlaces,
  joinIndicatorValues,
  CRS,
} from '@fari-brussels/geo-ingest'
```

## `@fari-brussels/viewer-core`

The renderer-agnostic contract: `LayerSpec`, `StyleSpec`, `RendererAdapter`,
`BaseAdapter`, capability negotiation (`selectAdapter`), and wire-type mappers.
No heavy dependencies.

```ts
import { selectAdapter, type LayerSpec } from '@fari-brussels/viewer-core'
```

## `@fari-brussels/viewer-cesium`

Cesium adapter implementing the contract — covers every layer kind, including
per-feature `colorBy` ramps. `cesium` is a peer dependency, so apps bundle it
only where used.

```ts
import { CesiumAdapter, cesiumDescriptor } from '@fari-brussels/viewer-cesium'
```

## `@fari-brussels/viewer-maplibre`

MapLibre GL adapter implementing the same contract — fast 2D vector/raster maps
with per-feature `colorBy` ramps compiled to MapLibre `step` / `interpolate`
expressions. Because the contract is shared, switching a norm in place becomes a
`setPaintProperty` call, which MapLibre animates on the GPU for free.
`maplibre-gl` is a peer dependency; apps import its CSS once.

```ts
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapLibreAdapter, maplibreDescriptor } from '@fari-brussels/viewer-maplibre'
```

## `@fari-brussels/viewer-vue`

Vue 3 bindings for any `RendererAdapter`: drop-in `<TwinViewer/>` component plus
composables — `useViewer`, `useLayer` / `useLayers` (keyed reconciliation),
`useRealtimeLayer` (poll + `loading`/`error`/`featureCount`), `useLayerStatus`,
and `useCameraControls` (zoom / rotate / reset). Teardown is hardened so route
changes never wedge a heavy renderer.

```ts
import { useViewer, useLayers, useCameraControls } from '@fari-brussels/viewer-vue'
```

## `@fari-brussels/auth-vue`

Null-safe Keycloak bindings: `useAuth` (login / logout / roles / token refresh /
avatar) plus pure redirect-URI helpers. Works whether or not the `vueKeycloak`
plugin was installed — an unconfigured app gets a coherent signed-out state. No
`vue-router` or env-var coupling.

```ts
import { useAuth } from '@fari-brussels/auth-vue'
const { isAuthenticated, login, logout, getToken } = useAuth()
```

## `@fari-brussels/query-vue`

Small [TanStack Vue Query](https://tanstack.com/query) helpers: `createMutation`
and `createOptimisticMutation`, which wire up cache invalidation so you don't
repeat it on every write.

```ts
import { createMutation } from '@fari-brussels/query-vue'
export const useCreateAsset = createMutation(postAsset, [queryKeys.assets.all])
```

## `@fari-brussels/twin-cesium` · `@fari-brussels/twin-maplibre` (bundles)

Batteries-included entry points: one install pulls the whole viewer stack for a
renderer (`viewer-core` + `viewer-vue` + the adapter), with the brand UI on a
`/ui` subpath. Granular installs still work; `cesium` / `maplibre-gl` stay peer
dependencies so the renderer is an explicit choice.

```ts
import { useViewer, CesiumAdapter, gradientLegend } from '@fari-brussels/twin-cesium'
import { FButton } from '@fari-brussels/twin-cesium/ui'
```

## `@fari-brussels/scenario-engine`

Statistical scenario modelling: regressors, dataset shaping, and override-driven
prediction for indicator timeseries.

```ts
import { predict, buildScenario } from '@fari-brussels/scenario-engine'
```

## `@fari-brussels/twin-llm`

Provider-agnostic LLM tool-call layer: a structured extractor + domain tools over
a conversation, decoupled from any specific model SDK.

```ts
import { createConversation } from '@fari-brussels/twin-llm'
```

## `fari-pipeline-core` + `fari-pipeline-service` (Python)

Step orchestration (`Pipeline`, `@step`, `ProgressEvent`, `PipelineError`) and a
FastAPI template that exposes it as `/jobs` / `/jobs/{id}` / `/result` /
`/files/{name}`, using the same `Job` / `JobResult` Pydantic models as
`@fari-brussels/twin-types` on the TS side.

```python
from fari_pipeline_core import Pipeline, step
from fari_pipeline_service import create_pipeline_service
```

---

For a worked example that uses these together, see the
[end-to-end walkthrough](/guide/end-to-end). Each package's repository README has
the full API reference.
