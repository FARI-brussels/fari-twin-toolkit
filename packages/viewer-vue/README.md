# @fari-brussels/viewer-vue

Vue 3 bindings for [`@fari-brussels/viewer-core`](../viewer-core). Wraps any
`RendererAdapter` (e.g. `@fari-brussels/viewer-cesium`) in idiomatic composables and a
drop-in component, so a Vue/Nuxt app gets a map/3D viewer without touching
lifecycle, refs, or the underlying renderer.

`vue` is a peer dependency; the renderer adapter is provided by the app.

## Component

```vue
<script setup lang="ts">
import { TwinViewer } from '@fari-brussels/viewer-vue'
import { CesiumAdapter } from '@fari-brussels/viewer-cesium'
import type { LayerSpec, PickResult } from '@fari-brussels/viewer-core'

const layers: LayerSpec[] = [
  { id: 'wards', kind: 'geojson', data: featureCollection, style: { fillColor: '#64D8BF' } },
]
const onPick = (p: PickResult) => console.log(p.properties)
</script>

<template>
  <TwinViewer
    :adapter="() => new CesiumAdapter()"
    :layers="layers"
    :basemap="{ kind: 'osm' }"
    :camera="{ center: { lon: 4.3517, lat: 50.8503 }, height: 4000 }"
    style="height: 70vh"
    @pick="onPick"
    @ready="() => console.log('ready')"
  />
</template>
```

The `layers` prop is reactive — push/replace it and the viewer reconciles
(adds/updates/removes by `id`). The component exposes `{ viewer, ready, error }`
via a template ref for imperative use.

## Composables

For full control, compose it yourself:

```ts
import { useViewer, useLayers } from '@fari-brussels/viewer-vue'
import { CesiumAdapter } from '@fari-brussels/viewer-cesium'

const { containerRef, viewer, ready, error } = useViewer(() => new CesiumAdapter(), {
  basemap: { kind: 'osm' },
})
useLayers(viewer, ready, () => myLayers.value)
// template: <div :ref="containerRef" />
```

- `useViewer(factory, options)` → `{ containerRef, viewer, ready, error }`
- `useLayer(viewer, ready, specRefOrGetter)` — one reactive layer
- `useLayers(viewer, ready, layersRefOrGetter)` — reconcile an array by id

## Nuxt / SSR

Viewers are client-only (WebGL). Render the host inside `<ClientOnly>`; the
adapter is created lazily on mount via the factory you pass.

## Test

```bash
pnpm --filter @fari-brussels/viewer-vue test
```

Tested headlessly with jsdom + `@vue/test-utils` against an in-memory
`MockAdapter` (extends `BaseAdapter`): mount/ready, layer reconciliation, pick
forwarding, and teardown — no WebGL required.
