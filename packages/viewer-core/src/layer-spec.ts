import type { Feature, FeatureCollection } from '@fari-brussels/twin-types'
import type { StyleSpec } from './style'

/**
 * What a viewer can draw. Application code describes *what* to render with a
 * LayerSpec; the adapter decides *how*. This is the contract every renderer
 * implements against.
 *
 * Note on casing: viewer-core is a client-side API and uses camelCase, whereas
 * the wire format (@fari-brussels/twin-types) uses snake_case. `from-twin-types.ts`
 * provides the mappers across that seam.
 */
export type LayerKind = 'geojson' | 'wms' | 'tileset3d' | 'realtime' | 'mesh3d' | 'pointcloud'

export interface BaseLayerSpec {
  id: string
  kind: LayerKind
  visible?: boolean
  /** 0–1. */
  opacity?: number
}

export interface GeoJsonLayerSpec extends BaseLayerSpec {
  kind: 'geojson'
  /** Inline GeoJSON or a URL to fetch it from. */
  data: FeatureCollection | Feature | string
  style?: StyleSpec
}

export interface WmsLayerSpec extends BaseLayerSpec {
  kind: 'wms'
  url: string
  layers: string[]
  parameters?: Record<string, string>
  /**
   * Coordinate reference system for the WMS request. Renderers that build a
   * provider directly (Cesium) default to `'CRS:84'` (lon/lat axis order,
   * matching Cesium's BBOX). Ignored by renderers that template the tile URL.
   */
  crs?: string
  /** Cap the request pyramid at this zoom level (Cesium `maximumLevel`). */
  maximumLevel?: number
  /** Tile pixel size requested from the server (Cesium `tileWidth`/`tileHeight`). */
  tileWidth?: number
  tileHeight?: number
}

/** Camera framing for a 3D layer's extent (e.g. a tileset's bounding sphere). */
export interface FrameOptions {
  /** Compass heading in degrees (0 = north). */
  heading?: number
  /** Pitch in degrees (negative looks down). */
  pitch?: number
  /** Distance as a multiple of bounding-sphere radius (tilesets). Default 2.5. */
  distanceMultiplier?: number
  /** Absolute camera distance in meters — used to frame a placed model. */
  distance?: number
}

export interface Tileset3dLayerSpec extends BaseLayerSpec {
  kind: 'tileset3d'
  /** Tileset URL. Omit when loading by `ionAssetId`. */
  url?: string
  /** Cesium Ion asset id (alternative to a direct url). */
  ionAssetId?: number
  /** Screen-space error budget — lower renders more detail (Cesium default 16). */
  maximumScreenSpaceError?: number
  /** Frame the camera on the tileset once loaded. Omit to leave the camera put. */
  frame?: FrameOptions
  /**
   * Supply request headers for the tileset (e.g. a bearer token) — the app's
   * injection seam for authed/private tilesets. Resolved per load; return
   * `undefined` for an unauthenticated request.
   */
  getHeaders?: () => Promise<Record<string, string> | undefined>
}

/**
 * Renderer-agnostic description of how to draw a single realtime feature. The
 * app computes this from a feature's properties (keeping its own style table as
 * data); the renderer turns it into billboards / lines / polygons.
 */
export interface RealtimeFeatureStyle {
  /** Render as an icon billboard built from this emoji glyph. */
  emoji?: string
  /** Icon / point-marker pixel size. Default 40. */
  sizePx?: number
  /** CSS color for point markers, lines, and polygon fills. */
  color?: string
  /** Static polyline width in px. See {@link RealtimeLayerSpec.dynamicLineWidth}. */
  lineWidth?: number
}

/** Maps a feature's properties to a {@link RealtimeFeatureStyle} (or default). */
export type RealtimeStyleFn = (
  properties: Record<string, unknown>,
) => RealtimeFeatureStyle | undefined

export interface RealtimeLayerSpec extends BaseLayerSpec {
  kind: 'realtime'
  /**
   * Endpoint returning a GeoJSON FeatureCollection. Used when `fetchFeatures`
   * is absent; the renderer fetches the URL directly (no auth headers).
   */
  endpoint?: string
  /**
   * App-controlled fetch returning the FeatureCollection. Use this when the
   * request needs auth headers, token injection, or response unwrapping the
   * renderer can't do from a bare URL.
   */
  fetchFeatures?: () => Promise<FeatureCollection>
  /** Provider id used to resolve styling (e.g. "stib", "telraam"). */
  sourceKind?: string
  /** Re-fetch interval in seconds. Omit / 0 to load once. */
  pollSeconds?: number
  /**
   * Per-feature styling callback. The app keeps its per-source style table as
   * data and the renderer draws the result. Falls back to `style` (declarative)
   * when omitted.
   */
  styleFeature?: RealtimeStyleFn
  /** Drape features on terrain. Default true. */
  clampToGround?: boolean
  /** Scale polyline width with camera height (good for traffic density lines). */
  dynamicLineWidth?: boolean
  /** Coerce stringified coordinates to numbers before rendering. Default false. */
  normalizeCoordinates?: boolean
  style?: StyleSpec
}

export interface GeoPosition {
  lon: number
  lat: number
  height?: number
}

export interface Mesh3dLayerSpec extends BaseLayerSpec {
  kind: 'mesh3d'
  /** glTF/GLB/OBJ model URL. */
  url: string
  position: GeoPosition
  scale?: number
  /** Heading/pitch/roll in degrees. */
  orientation?: { heading?: number; pitch?: number; roll?: number }
  /** Never render the model smaller than this many pixels. */
  minimumPixelSize?: number
  /** Cap the model's on-screen scale (meters). */
  maximumScale?: number
  /** Frame the camera on the model once placed (uses `FrameOptions.distance`). */
  frame?: FrameOptions
  lod?: 0 | 1 | 2 | 3
}

export interface PointCloudLayerSpec extends BaseLayerSpec {
  kind: 'pointcloud'
  url: string
}

export type LayerSpec =
  | GeoJsonLayerSpec
  | WmsLayerSpec
  | Tileset3dLayerSpec
  | RealtimeLayerSpec
  | Mesh3dLayerSpec
  | PointCloudLayerSpec

export interface BasemapSpec {
  kind: 'osm' | 'xyz' | 'none'
  /** Tile URL template for `kind: 'xyz'`. */
  url?: string
}

export interface CameraTarget {
  center?: { lon: number; lat: number }
  /** Camera height in meters (for a point target). */
  height?: number
  /** Fit this bbox [west, south, east, north] instead of a point. */
  bbox?: [number, number, number, number]
  /** Degrees. */
  heading?: number
  /** Degrees. */
  pitch?: number
}

export interface FlyOptions {
  durationMs?: number
}

/** Options for an incremental camera rotation. */
export interface RotateOptions {
  /** Animate the turn (default true) vs. snap instantly. */
  animate?: boolean
}

/**
 * Toggle the user-driven camera interactions. Renderer-agnostic; an adapter
 * maps these onto whatever input gestures it supports.
 */
export interface CameraControlOptions {
  enableRotate?: boolean
  enableZoom?: boolean
  enableTilt?: boolean
  enableLook?: boolean
}

/** A snapshot of where the camera currently sits. */
export interface CameraState {
  center: { lon: number; lat: number }
  /** Camera height in meters. */
  height: number
  /** Compass heading in degrees. */
  heading: number
  /** Pitch in degrees (negative looks down). */
  pitch: number
}

export interface ViewerOpts {
  initialCamera?: CameraTarget
  basemap?: BasemapSpec | null
}
