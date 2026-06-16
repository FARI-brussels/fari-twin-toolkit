# @fari-brussels/digital-twin

The **FARI Digital Twin** — the pilot app that proves the toolkit. A Cesium + Vue
application (asset / map-layer / 3D-tileset / realtime libraries, Keycloak auth,
live FARI backend + Mobility Twin API) built **entirely on `@fari-brussels/*` packages**.
Migrated from [`fari-digital-twin-frontend`](https://github.com/FARI-brussels/fari-digital-twin-frontend);
it looks and behaves the same, but every renderer/auth/data seam now goes through
the toolkit instead of bespoke Cesium code.

## What it consumes from the toolkit

| Concern               | Package                                   | Used for                                                     |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Renderer-agnostic map | `@fari-brussels/viewer-vue` + `@fari-brussels/viewer-cesium`| `useViewer` / `useLayers` / `useRealtimeLayer` / `useCameraControls` / `useLayerStatus`; **no direct Cesium in app code** |
| Layer contract        | `@fari-brussels/viewer-core`                       | `LayerSpec` (wms/geojson/tileset3d/realtime/mesh3d), `gradientLegend`, color ramps |
| Auth                  | `@fari-brussels/auth-vue`                          | `useAuth` (null-safe Keycloak) + redirect-URI helpers        |
| Data mutations        | `@fari-brussels/query-vue`                         | `createMutation` / `createOptimisticMutation`                |
| UI components         | `@fari-brussels/twin-ui-vue`                       | `FButton` (gradient), `FSegmented`, `FCheckbox`, `FChip`, `FCard` |
| Brand tokens / icons  | `@fari-brussels/twin-ui-tokens` / `@fari-brussels/twin-ui-icons` | `--fari-*` custom properties, FARI icon set            |

App-specific seams stay in the app as **data/callbacks**, not in the toolkit:
the realtime style table (`src/lib/realtime.ts`), the authed fetch clients
(`src/api/*`), and the WMS/tileset configs.

## Develop

From the monorepo root (full HMR against the `@fari-brussels/*` sources):

```bash
pnpm install
pnpm --filter @fari-brussels/digital-twin dev   # → http://localhost:5173
```

> Port **5173** matches the origin the upstream Keycloak `front` /
> `development-no-use-in-prod` client whitelists — don't change it if you want
> login to work locally.

## Environment

Copy `.env.example` → `.env` and fill in:

| Var                          | Purpose                                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| `VITE_BACKEND_URL`           | Asset / tileset / map-layer CRUD API base URL                     |
| `VITE_TWIN_API_TOKEN`        | Mobility Twin realtime API bearer token (**never commit**)        |
| `VITE_KEYCLOAK_URL` …        | Keycloak url/realm/clientId. **Omit `VITE_KEYCLOAK_URL` to run unauthenticated** (no login, no token-refresh console noise). |
| `VITE_CESIUM_ION_ACCESS_TOKEN` | Optional — Ion custom terrain for the tileset viewer            |

## Structure

```
src/
  components/        MapViewer, RealtimeViewer, TilesetViewer, AssetViewer (all toolkit-based)
  views/libraries/   Asset / Map / Tileset / Realtime library pages
  composables/       useAuth, useLoginDialog (thin wrappers over @fari-brussels/auth-vue)
  lib/               realtime.ts (style table + authed fetch), layerStyles.ts
  api/               ky clients + TanStack queries (auth header via @fari-brussels/auth-vue)
```

## Notes from the migration

- The bespoke `composables/cesium/*` (viewer/camera/realtime/tileset) were
  **deleted** — replaced by the toolkit's adapter + Vue bindings.
- Reusable pieces were **promoted into the toolkit**: the realtime engine
  (icon-atlas, poll lifecycle, camera-responsive lines), the WMS/tileset/model
  resource cache, camera controls, the color/legend helpers, `useAuth`, the
  mutation factories, and the UI components above.
- Viewer teardown is hardened in `@fari-brussels/viewer-vue` / `viewer-cesium`, so route
  changes never wedge the app.
