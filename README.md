# fari-twin-toolkit

Reusable libraries and services for FARI digital-twin projects. The goal is a
standardized architecture we can implement in different ways per client, instead
of rebuilding the same building blocks (geo ingestion, viewers, indicators,
scenarios, processing pipelines) from scratch every time.

## Principles

1. **Performance over consistency where they conflict.** Multiple renderers are
   allowed, but renderer choice is an implementation detail behind one shared
   API. Application code never references Cesium / MapLibre / Three directly.
2. **Standardize the seams, not the implementations.** Wire formats (types),
   public APIs (adapters, composables), and ingestion contracts are
   standardized. The code underneath is free to differ.
3. **The existing repos are requirement references, not code to port.** TreeCity,
   BrusselsMigration and fari-digital-twin-frontend define the functionality we
   must support. We reimplement cleanly on proper frameworks; differing
   implementations are fine as long as functionality is preserved.
4. **One source of truth for the wire format.** OpenAPI spec generates both
   Pydantic models and TypeScript types — no drift.
5. **Adding a renderer / ingestion source / pipeline step is fill-in-the-blanks,
   not an architecture project.**

## Layout

```
packages/            JS/TS libraries (pnpm + turbo)
  twin-ui-tokens/    FARI brand tokens (colors, gradients, typography)   [ready]
  twin-types/        OpenAPI-generated TS types                          [ready]
  geo-ingest/        Node geo data ingestion (proj4, shp/xlsx, places)   [ready]
  viewer-core/       Renderer-agnostic viewer contract + helpers          [ready]
  viewer-cesium/     Cesium adapter implementing viewer-core              [ready]
  viewer-maplibre/   MapLibre adapter implementing viewer-core            [ready]
  viewer-vue/        Vue 3 bindings for viewer-core                       [ready]
  auth-vue/          Null-safe Keycloak auth composable (useAuth)         [ready]
  query-vue/         TanStack Query mutation factories                    [ready]
  twin-ui-icons/     Canonical FARI icon set as Vue components            [ready]
  twin-ui-vue/       Vue 3 component library (v3, SFC + Vite lib mode)     [ready]
  twin-cesium/       Bundle: viewer stack + UI, one install (Cesium)      [ready]
  twin-maplibre/     Bundle: viewer stack + UI, one install (MapLibre)    [ready]
  scenario-engine/   Regression models + scenario overrides                [ready]
  twin-llm/          LLM tool-call layer (provider-agnostic)               [ready]
python/              Python libraries/services (uv)
  twin-types/        Pydantic models generated from the OpenAPI spec     [ready]
  pipeline-core/     Step orchestration for long-running analysis        [ready]
  pipeline-service/  FastAPI template wrapping pipeline-core             [ready]
specs/
  openapi.yaml       Source of truth for the wire format                 [ready]
apps/
  playground/        Visual mockup app (tokens + live Cesium map, HMR)    [ready]
  brussels-twin/     BrusselsMigration v2 — real consumer of every lib    [ready]
  air-quality/       Brussels NO₂ demo on the MapLibre renderer           [ready]
  digital-twin/      FARI Digital Twin — pilot consumer of the toolkit    [ready]
  docs/              VitePress documentation site                         [ready]
```

The **digital-twin** app is the pilot: a full Cesium + Vue app (asset / tileset /
map-layer / realtime libraries, Keycloak auth) built entirely on `@fari-brussels/*`. It
proves the toolkit against a real backend — see `apps/digital-twin/README.md`.
Publishing the packages is covered in [`PUBLISHING.md`](./PUBLISHING.md).

Phase 2 (built once a second real consumer exists): `scenario-engine`,
`twin-sdk`, `twin-api`, `twin-llm`.

## Stack

- **Frontend framework:** Vue 3 + Nuxt (component layer); design tokens and viewer
  adapters are kept framework-agnostic to keep a Svelte port open later.
- **Package manager:** pnpm + turbo. **TS build:** tsup. **Python:** uv + ruff +
  Pydantic v2.
- **Codegen:** `openapi-typescript` (TS) + `datamodel-code-generator` (Pydantic).
- **License:** Apache-2.0.

## Develop

```bash
pnpm install
pnpm build       # turbo build across packages
pnpm typecheck
pnpm test
pnpm --filter @fari-brussels/playground dev   # visual playground with HMR (:5180)
pnpm --filter @fari-brussels/docs dev         # documentation site
```

Full usage docs (getting started, end-to-end walkthrough, per-package reference)
live in `apps/docs` — run the command above or see the deployed site.

## Quality gates

Every change is guarded by CI (`.github/workflows/ci.yml`):

- **build / typecheck** across all packages (turbo).
- **tests** — Vitest (TS) where there's real logic, pytest (Python). Generated
  packages are not unit-tested; their guarantee is typecheck + the drift check.
- **format** — Prettier (`pnpm format:check`); generated files are
  `.prettierignore`d so formatting never fights codegen.
- **codegen drift** — regenerate TS + Pydantic from `specs/openapi.yaml` and fail
  if the committed output differs. This is what keeps the two languages in sync.

Python lives under `python/` and is managed by `uv`, separately from the pnpm
workspace.
