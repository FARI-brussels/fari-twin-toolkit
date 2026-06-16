# @fari-brussels/twin-cesium

The **batteries-included** entry point for a Cesium + Vue digital-twin app. One
install gives you the whole viewer stack — `@fari-brussels/viewer-core` (contract, layer
specs, color/legend), `@fari-brussels/viewer-vue` (composables + `<TwinViewer>`),
`@fari-brussels/viewer-cesium` (the Cesium adapter) — plus the FARI brand UI components on
a subpath.

It's a thin re-export bundle: the real packages stay external, so you still get
one copy of each and full tree-shaking.

## Install

```bash
pnpm add @fari-brussels/twin-cesium vue cesium
```

`vue` and `cesium` are **peer dependencies** — you install the renderer
explicitly, so the bundle never forces a Cesium version on you (and a MapLibre
app reaches for `@fari-brussels/twin-maplibre` instead).

## Use

```ts
// Viewer stack — one import
import {
  useViewer,
  useLayers,
  useCameraControls,
  CesiumAdapter,
  gradientLegend,
} from '@fari-brussels/twin-cesium'

// Brand UI components — /ui subpath (avoids name clashes with the viewer API)
import { FButton, FChoroplethLegend } from '@fari-brussels/twin-cesium/ui'

// Stylesheets
import '@fari-brussels/twin-ui-tokens/css'
import '@fari-brussels/twin-ui-vue/style.css'
```

## Prefer granular? That still works.

The bundle is purely additive. For a minimal footprint, install only what you
need:

```bash
pnpm add @fari-brussels/viewer-core            # just the renderer-agnostic contract
pnpm add @fari-brussels/viewer-vue @fari-brussels/viewer-cesium vue cesium   # viewer, no UI
```

Cross-cutting add-ons are à la carte (not in the bundle), since not every app
uses them:

- `@fari-brussels/auth-vue` — Keycloak auth (`useAuth`)
- `@fari-brussels/query-vue` — TanStack mutation factories

## What's inside

| Subpath                         | Re-exports                                                    |
| ------------------------------- | ------------------------------------------------------------- |
| `@fari-brussels/twin-cesium`    | `@fari-brussels/viewer-core` + `viewer-vue` + `viewer-cesium` |
| `@fari-brussels/twin-cesium/ui` | `@fari-brussels/twin-ui-vue` (tokens + icons transitively)    |
