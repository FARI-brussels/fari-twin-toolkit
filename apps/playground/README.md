# @fari-brussels/playground

Visual playground / mockup app for the FARI Twin Toolkit and the fast feedback
loop for the UI + viewer layers. Two tabs:

- **Design tokens** — live colors, gradients and type scale from
  `@fari-brussels/twin-ui-tokens`.
- **Map (Cesium)** — a real `@fari-brussels/viewer-cesium` adapter driven only through the
  `@fari-brussels/viewer-core` contract: OSM basemap, an inline GeoJSON layer styled with
  brand colors, `flyTo` Brussels, and click-to-pick. No Cesium Ion token needed.

Not published (`private`).

```bash
pnpm --filter @fari-brussels/playground dev      # HMR dev server on :5180 (open the Map tab)
pnpm --filter @fari-brussels/playground build    # production build (bundles + copies Cesium)
```

Cesium static assets are handled by `vite-plugin-cesium` (no manual
`CESIUM_BASE_URL` needed). Editing the playground hot-reloads instantly; editing a
workspace package reflects after its `pnpm build`.
