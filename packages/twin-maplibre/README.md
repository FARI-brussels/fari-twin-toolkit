# @fari-brussels/twin-maplibre

The **batteries-included** entry point for a MapLibre + Vue digital-twin app. One
install gives you the whole viewer stack — `@fari-brussels/viewer-core`,
`@fari-brussels/viewer-vue`, `@fari-brussels/viewer-maplibre` — plus the FARI brand UI components on
a subpath. The MapLibre sibling of [`@fari-brussels/twin-cesium`](../twin-cesium).

It's a thin re-export bundle: the real packages stay external, so you still get
one copy of each and full tree-shaking.

## Install

```bash
pnpm add @fari-brussels/twin-maplibre vue maplibre-gl
```

`vue` and `maplibre-gl` are **peer dependencies** — you install the renderer
explicitly.

## Use

```ts
import { useViewer, useLayers, MapLibreAdapter, gradientLegend } from '@fari-brussels/twin-maplibre'
import { FButton, FChoroplethLegend } from '@fari-brussels/twin-maplibre/ui'

import '@fari-brussels/twin-ui-tokens/css'
import '@fari-brussels/twin-ui-vue/style.css'
```

## Prefer granular? That still works.

The bundle is purely additive:

```bash
pnpm add @fari-brussels/viewer-core                                       # contract only
pnpm add @fari-brussels/viewer-vue @fari-brussels/viewer-maplibre vue maplibre-gl  # viewer, no UI
```

Cross-cutting add-ons stay à la carte: `@fari-brussels/auth-vue`, `@fari-brussels/query-vue`.

## What's inside

| Subpath                           | Re-exports                                                      |
| --------------------------------- | --------------------------------------------------------------- |
| `@fari-brussels/twin-maplibre`    | `@fari-brussels/viewer-core` + `viewer-vue` + `viewer-maplibre` |
| `@fari-brussels/twin-maplibre/ui` | `@fari-brussels/twin-ui-vue` (tokens + icons transitively)      |
