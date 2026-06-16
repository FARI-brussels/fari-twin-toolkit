# Nuxt + Cesium setup

Recipe for using `@fari-brussels/viewer-vue` + `@fari-brussels/viewer-cesium` in a Nuxt 3 app.
Cesium needs WebGL and ships static workers/assets, so a couple of small things
must be in place — none of them are surprises, but they bite if missed.

## 1. Install

```bash
pnpm add @fari-brussels/twin-types @fari-brussels/twin-ui-tokens @fari-brussels/twin-ui-vue \
         @fari-brussels/viewer-core @fari-brussels/viewer-vue @fari-brussels/viewer-cesium cesium
pnpm add -D vite-plugin-cesium
```

## 2. Load the toolkit CSS once

In `app.vue` (or a global plugin):

```ts
import '@fari-brussels/twin-ui-tokens/css'
import '@fari-brussels/twin-ui-vue/style.css'
```

## 3. Wire Cesium's static assets via Vite

`nuxt.config.ts`:

```ts
import cesium from 'vite-plugin-cesium'

export default defineNuxtConfig({
  vite: { plugins: [cesium()] },
  runtimeConfig: {
    public: { cesiumIonToken: process.env.CESIUM_ION_TOKEN ?? '' },
  },
})
```

`vite-plugin-cesium` copies Cesium's `Build/Cesium` (Workers, Assets, Widgets) to
`dist/cesium/` and sets `window.CESIUM_BASE_URL` automatically. The Ion token is
only needed for Ion assets / world terrain; OSM basemap + plain 3D Tiles work
without one.

## 4. Render the viewer inside `<ClientOnly>`

Viewers are client-only (WebGL). Wrap the host component:

```vue
<script setup lang="ts">
import { TwinViewer } from '@fari-brussels/viewer-vue'
import { CesiumAdapter } from '@fari-brussels/viewer-cesium'
import type { LayerSpec, PickResult } from '@fari-brussels/viewer-core'
import { tokens } from '@fari-brussels/twin-ui-tokens'

const config = useRuntimeConfig()

const layers: LayerSpec[] = [
  {
    id: 'communes',
    kind: 'geojson',
    data: featureCollection,
    style: {
      colorBy: {
        property: 'value',
        stops: [
          { value: 5, color: tokens.brandColors.lighthouseBlue },
          { value: 20, color: tokens.statusColors.notOk },
        ],
      },
      strokeColor: tokens.brandColors.blue,
      strokeWidth: 1,
    },
  },
]

const onPick = (pick: PickResult) => console.log(pick.properties)
</script>

<template>
  <ClientOnly>
    <TwinViewer
      :adapter="() => new CesiumAdapter({ ionToken: config.public.cesiumIonToken })"
      :layers="layers"
      :basemap="{ kind: 'osm' }"
      :camera="{ bbox: [4.25, 50.79, 4.45, 50.91] }"
      style="height: 70vh"
      @pick="onPick"
    />
  </ClientOnly>
</template>
```

`useRuntimeConfig().public.cesiumIonToken` keeps the token out of the bundle and
controllable per environment.

## 5. Common pitfalls

- **CESIUM_BASE_URL undefined.** You forgot the `cesium()` plugin in
  `nuxt.config.ts`, or you're trying to render server-side (use `<ClientOnly>`).
- **Black globe.** WebGL is disabled / unavailable (some Linux CI, some
  remoting). Test in a real browser.
- **Tiny tiles, scaled wrong.** A parent with no explicit height — give the
  viewer container a height (`70vh` above).
- **Component re-mounts on tab switch destroy Cesium.** Expected — `BaseAdapter`
  cleans up. If you want to keep the viewer alive, hoist it above the tab.
