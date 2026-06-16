# Introduction

The **FARI Twin Toolkit** is a set of small, focused libraries that every FARI
digital-twin project can build on, instead of rebuilding the same plumbing
(geo ingestion, typed data, map/3D viewers, brand UI) each time.

## Principles

1. **Performance over consistency where they conflict.** Multiple renderers are
   allowed, but renderer choice is an implementation detail behind one shared
   API. Application code never imports Cesium / MapLibre / Three directly.
2. **Standardize the seams, not the implementations.** Wire formats, public
   APIs and ingestion contracts are standardized; the code underneath is free to
   differ.
3. **One source of truth for the wire format.** An OpenAPI spec generates both
   TypeScript types and Pydantic models — no drift between frontend and backend.
4. **Adding a renderer / ingestion source / pipeline step is fill-in-the-blanks,
   not an architecture project.**

## The packages

| Package                                       | What it does                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`@fari-brussels/twin-types`](/packages/)     | TypeScript types for the wire format (generated).                                                         |
| `fari-twin-types` (Python)                    | Pydantic models for the same wire format (generated).                                                     |
| [`@fari-brussels/twin-ui-tokens`](/packages/) | FARI brand colors, gradients, typography.                                                                 |
| [`@fari-brussels/twin-ui-icons`](/packages/)  | The canonical FARI icon set as tree-shakeable Vue components.                                             |
| [`@fari-brussels/twin-ui-vue`](/packages/)    | Vue 3 component library (primitives + domain widgets) on tokens + icons.                                  |
| [`@fari-brussels/geo-ingest`](/packages/)     | Reprojection, shapefile/Excel readers, containment, Feature → Place, indicator-to-FeatureCollection join. |
| [`@fari-brussels/viewer-core`](/packages/)    | Renderer-agnostic viewer contract + helpers.                                                              |
| [`@fari-brussels/viewer-cesium`](/packages/)  | Cesium adapter implementing the contract (incl. data-driven `colorBy`).                                   |
| [`@fari-brussels/viewer-vue`](/packages/)     | Vue 3 bindings: `<TwinViewer/>` + `useViewer`/`useLayer(s)` composables.                                  |
| `fari-pipeline-core` (Python)                 | Step orchestration for long-running analysis.                                                             |
| `fari-pipeline-service` (Python)              | FastAPI template wrapping pipeline-core (`Job`/`JobResult`/`JobFile`).                                    |

These compose: ingest geodata into typed `Place`s, attach `Indicator`
timeseries, then render with a viewer adapter styled by brand tokens. The
[end-to-end walkthrough](/guide/end-to-end) does exactly that.

## How it relates to existing projects

The toolkit generalizes patterns proven in three FARI proofs-of-concept
(TreeCity, BrusselsMigration, the digital-twin frontend). Those repos are
_requirement references_ — the toolkit reimplements their shared functionality
cleanly so new projects don't start from a blank page.
