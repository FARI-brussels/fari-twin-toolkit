# Architecture & seams

The toolkit is organized around a few **seams** — stable interfaces that let the
implementations behind them change freely.

## Layers

```
DATA PLANE        @fari-brussels/geo-ingest        (Node ingestion + join helper)
                  fari-pipeline-core      (Python step orchestration)
                  fari-pipeline-service   (FastAPI template wrapping it)

DOMAIN            specs/openapi.yaml  ──gen──▶  @fari-brussels/twin-types  (TS)
                                      ──gen──▶  fari-twin-types  (Python)

FRONTEND          @fari-brussels/twin-ui-tokens    (brand)
                  @fari-brussels/twin-ui-icons     (canonical icon set)
                  @fari-brussels/twin-ui-vue       (Vue 3 component library)
                  @fari-brussels/viewer-core       (contract)
                    ├─ @fari-brussels/viewer-cesium   (Cesium adapter)
                    └─ @fari-brussels/viewer-vue       (Vue bindings + <TwinViewer/>)

PHASE 2 (planned) @fari-brussels/scenario-engine, @fari-brussels/twin-llm, BrusselsMigration v2
```

## Seam 1 — the wire format

`specs/openapi.yaml` is the single source of truth. Codegen produces TypeScript
types and Pydantic v2 models from it; CI fails if either committed output drifts
from the spec. **Edit the spec, never the generated files.**

- Wire fields are `snake_case` (zero-config for Pydantic/FastAPI and the existing
  backend).
- Geometry follows GeoJSON (RFC 7946).
- `LayerSpec` is intentionally **not** in the wire format — how to draw something
  is a client concern, so it lives in `@fari-brussels/viewer-core`.

## Seam 2 — the renderer contract

`@fari-brussels/viewer-core` defines `RendererAdapter`: `mount / addLayer / updateLayer /
removeLayer / setBasemap / flyTo / on`. Application code depends only on this.

- `LayerSpec` describes **what** to draw (`geojson | wms | tileset3d | realtime |
mesh3d | pointcloud`); the adapter decides **how**.
- `StyleSpec` is declarative (fill/stroke/point/icon + data-driven `colorBy`
  ramps) — no renderer-specific callbacks leak through.
- `BaseAdapter` does the bookkeeping (layer registry, duplicate/capability/
  not-found checks, events), so a new renderer only fills in the `on*` hooks.
- `selectAdapter(descriptors, requiredKinds)` chooses the lightest renderer that
  can draw a screen's layers — that's how "Leaflet for 2D, Cesium for 3D" becomes
  automatic rather than hard-coded.

### Casing convention

Wire types are `snake_case`; the viewer API is `camelCase` (idiomatic
client-side TS). The mappers in `@fari-brussels/viewer-core/from-twin-types`
(`layerFromWmsLayer`, …) bridge that seam.

## Seam 3 — brand tokens

`@fari-brussels/twin-ui-tokens` keeps TypeScript as the single source of truth; the CSS
custom properties and the Tailwind preset are **generated** from it, so they
never drift. Brand rules (status colors are demo-only, purple is sparing) are
encoded in the structure and docs.

## Testing strategy

- **Unit tests where there's real logic** — Vitest (TS), pytest (Python).
- **Generated packages aren't unit-tested** — their guarantee is `typecheck`
  plus the CI codegen-drift check.
- **Renderers need a browser (WebGL)** — the contract is fully tested in
  `@fari-brussels/viewer-core` with an in-memory `TestAdapter`; the Cesium adapter is
  typechecked and verified visually in the playground.

## Why multiple renderer packages

Cesium is a multi-megabyte WebGL dependency. Making each renderer its own package
(`@fari-brussels/viewer-cesium`, future `@fari-brussels/viewer-maplibre`, …) means an app only
installs and bundles the weight it actually uses — the contract in
`@fari-brussels/viewer-core` stays dependency-light.
