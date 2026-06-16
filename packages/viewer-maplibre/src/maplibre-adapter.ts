import maplibregl, {
  type AddLayerObject,
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type LngLatBoundsLike,
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
  type MapMouseEvent,
  type MapOptions,
  type SourceSpecification,
  type StyleSpecification,
} from 'maplibre-gl'
import {
  BaseAdapter,
  type BasemapSpec,
  type CameraTarget,
  type FlyOptions,
  type GeoJsonLayerSpec,
  type LayerKind,
  type LayerSpec,
  type PickResult,
  type RealtimeLayerSpec,
  type StyleSpec,
  type ViewerOpts,
  type WmsLayerSpec,
} from '@fari-brussels/viewer-core'
import { circlePaint, fillPaint, linePaint, type PaintProps } from './paint'

export interface MapLibreAdapterOptions {
  /** Extra MapLibre Map construction options merged over the defaults. */
  mapOptions?: Partial<MapOptions>
}

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '© OpenStreetMap contributors'
const BASEMAP_ID = '__basemap__'

/** An empty MapLibre style — we add basemap + data layers ourselves. */
const EMPTY_STYLE: StyleSpecification = { version: 8, sources: {}, layers: [] }

const MAPLIBRE_CAPABILITIES: ReadonlySet<LayerKind> = new Set<LayerKind>([
  'geojson',
  'wms',
  'realtime',
])

/** Filters splitting one GeoJSON source into geometry-typed sub-layers. */
const POINT_FILTER = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false]
const AREA_FILTER = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false]
const LINE_FILTER = [
  'match',
  ['geometry-type'],
  ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'],
  true,
  false,
]

/**
 * Renders toolkit LayerSpecs on a MapLibre GL map. Fast 2D vector/raster
 * rendering with built-in paint transitions — updating a layer's `colorBy`
 * recolours every feature in a single animated pass on the GPU.
 *
 * Each GeoJSON LayerSpec becomes one source plus up to three sub-layers
 * (`__fill`, `__line`, `__circle`) filtered by geometry type, so a single spec
 * can carry points, polygons and lines and each is styled appropriately.
 */
export class MapLibreAdapter extends BaseAdapter {
  readonly name = 'maplibre'
  readonly capabilities = MAPLIBRE_CAPABILITIES

  private map?: MapLibreMap
  /** spec id → its geometry sub-layer ids (in draw order). */
  private readonly geojsonLayers = new Map<string, string[]>()
  /** spec id → raster sub-layer id (wms). */
  private readonly rasterLayers = new Map<string, string>()
  private readonly polls = new Map<string, ReturnType<typeof setInterval>>()
  /** Sub-layer ids eligible for click/hover picking. */
  private readonly queryable = new Set<string>()

  constructor(private readonly options: MapLibreAdapterOptions = {}) {
    super()
  }

  /** The underlying MapLibre Map (available after mount resolves). */
  get maplibreMap(): MapLibreMap | undefined {
    return this.map
  }

  protected onMount(container: HTMLElement, opts: ViewerOpts): Promise<void> {
    const center = opts.initialCamera?.center
    return new Promise<void>((resolve) => {
      const map = new maplibregl.Map({
        container,
        style: EMPTY_STYLE,
        center: center ? [center.lon, center.lat] : [4.3517, 50.8503],
        zoom: 10,
        attributionControl: { compact: true },
        ...this.options.mapOptions,
      })
      this.map = map
      map.on('click', (event: MapMouseEvent) => this.handlePick(event, 'click'))
      map.on('mousemove', (event: MapMouseEvent) => this.handlePick(event, 'hover'))
      map.on('error', (event) =>
        this.emitter.emit('error', event.error ?? new Error('maplibre error')),
      )
      map.once('load', () => resolve())
    })
  }

  protected onDestroy(): void {
    for (const timer of this.polls.values()) clearInterval(timer)
    this.polls.clear()
    this.geojsonLayers.clear()
    this.rasterLayers.clear()
    this.queryable.clear()
    this.map?.remove()
    this.map = undefined
  }

  protected onAddLayer(spec: LayerSpec): void {
    switch (spec.kind) {
      case 'geojson':
        this.addGeoJson(spec)
        break
      case 'realtime':
        this.addRealtime(spec)
        break
      case 'wms':
        this.addWms(spec)
        break
      // tileset3d / mesh3d / pointcloud are rejected by capability negotiation.
    }
  }

  protected onUpdateLayer(next: LayerSpec, prev: LayerSpec): void {
    // GeoJSON updates in place — this is where animated recolour comes from.
    if (next.kind === 'geojson' && prev.kind === 'geojson') {
      this.updateGeoJson(next)
      return
    }
    // Everything else: rebuild.
    this.onRemoveLayer(prev)
    this.onAddLayer(next)
  }

  protected onRemoveLayer(spec: LayerSpec): void {
    const map = this.map
    if (!map) return
    const id = spec.id
    for (const sub of this.geojsonLayers.get(id) ?? []) {
      if (map.getLayer(sub)) map.removeLayer(sub)
      this.queryable.delete(sub)
    }
    this.geojsonLayers.delete(id)
    const raster = this.rasterLayers.get(id)
    if (raster && map.getLayer(raster)) map.removeLayer(raster)
    this.rasterLayers.delete(id)
    const timer = this.polls.get(id)
    if (timer) {
      clearInterval(timer)
      this.polls.delete(id)
    }
    if (map.getSource(id)) map.removeSource(id)
  }

  protected onSetBasemap(spec: BasemapSpec | null): void {
    const map = this.map
    if (!map) return
    if (map.getLayer(BASEMAP_ID)) map.removeLayer(BASEMAP_ID)
    if (map.getSource(BASEMAP_ID)) map.removeSource(BASEMAP_ID)
    if (!spec || spec.kind === 'none') return
    const url = spec.kind === 'xyz' ? spec.url : OSM_URL
    if (!url) return
    map.addSource(BASEMAP_ID, {
      type: 'raster',
      tiles: [url],
      tileSize: 256,
      attribution: spec.kind === 'osm' ? OSM_ATTRIBUTION : '',
    } as SourceSpecification)
    // Keep the basemap at the bottom of the stack.
    const layers = map.getStyle().layers
    const beforeId = layers.length ? layers[0]!.id : undefined
    map.addLayer({ id: BASEMAP_ID, type: 'raster', source: BASEMAP_ID }, beforeId)
  }

  protected onFlyTo(target: CameraTarget, opts: FlyOptions): Promise<void> {
    const map = this.map
    if (!map) return Promise.resolve()
    const duration = opts.durationMs ?? 0
    return new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        resolve()
      }
      map.once('moveend', finish)
      // moveend isn't guaranteed if the camera doesn't actually move.
      setTimeout(finish, duration + 80)
      if (target.bbox) {
        const [w, s, e, n] = target.bbox
        map.fitBounds(
          [
            [w, s],
            [e, n],
          ] as LngLatBoundsLike,
          {
            duration,
            padding: 32,
            bearing: target.heading ?? 0,
            pitch: target.pitch ?? 0,
          },
        )
      } else if (target.center) {
        map.flyTo({
          center: [target.center.lon, target.center.lat],
          zoom: zoomForHeight(target.height),
          duration,
          bearing: target.heading ?? 0,
          pitch: target.pitch ?? 0,
        })
      } else {
        finish()
      }
    })
  }

  // --- layer builders ---

  private addGeoJson(spec: GeoJsonLayerSpec): void {
    const map = this.map
    if (!map) return
    map.addSource(spec.id, {
      type: 'geojson',
      data: spec.data,
      generateId: true,
    } as GeoJSONSourceSpecification)
    this.addGeoJsonSubLayers(spec.id, spec.style, spec.visible)
  }

  private addRealtime(spec: RealtimeLayerSpec): void {
    const map = this.map
    if (!map) return
    // MapLibre loads realtime data from a URL; the `fetchFeatures` injection
    // seam (used by Cesium for authed fetches) isn't supported here.
    const url = spec.endpoint
    if (!url) return
    map.addSource(spec.id, {
      type: 'geojson',
      data: url,
      generateId: true,
    } as GeoJSONSourceSpecification)
    this.addGeoJsonSubLayers(spec.id, spec.style, spec.visible)
    if (spec.pollSeconds && spec.pollSeconds > 0) {
      this.polls.set(
        spec.id,
        setInterval(() => {
          const source = map.getSource(spec.id) as GeoJSONSource | undefined
          source?.setData(url)
        }, spec.pollSeconds * 1000),
      )
    }
  }

  private addGeoJsonSubLayers(
    sourceId: string,
    style: StyleSpec | undefined,
    visible?: boolean,
  ): void {
    const map = this.map
    if (!map) return
    const visibility = visible === false ? 'none' : 'visible'
    const fillId = `${sourceId}__fill`
    const lineId = `${sourceId}__line`
    const circleId = `${sourceId}__circle`
    this.addPaintLayer(fillId, 'fill', sourceId, AREA_FILTER, fillPaint(style), visibility)
    this.addPaintLayer(lineId, 'line', sourceId, LINE_FILTER, linePaint(style), visibility)
    this.addPaintLayer(circleId, 'circle', sourceId, POINT_FILTER, circlePaint(style), visibility)
    const subs = [fillId, lineId, circleId]
    this.geojsonLayers.set(sourceId, subs)
    for (const sub of subs) this.queryable.add(sub)
  }

  private addPaintLayer(
    id: string,
    type: 'fill' | 'line' | 'circle',
    source: string,
    filter: unknown[],
    paint: PaintProps,
    visibility: 'visible' | 'none',
  ): void {
    // Cast at the renderer boundary: our paint/filter helpers are intentionally
    // permissive (see paint.ts) and don't carry MapLibre's per-property types.
    this.map?.addLayer({
      id,
      type,
      source,
      filter,
      paint,
      layout: { visibility },
    } as unknown as AddLayerObject)
  }

  private updateGeoJson(spec: GeoJsonLayerSpec): void {
    const map = this.map
    if (!map) return
    const source = map.getSource(spec.id) as GeoJSONSource | undefined
    if (!source) {
      // Layer was never added (or was removed) — add it fresh.
      this.addGeoJson(spec)
      return
    }
    source.setData(spec.data as GeoJSONSourceSpecification['data'])
    // Re-applying paint triggers MapLibre's built-in transition → animated recolour.
    this.applyPaint(`${spec.id}__fill`, fillPaint(spec.style))
    this.applyPaint(`${spec.id}__line`, linePaint(spec.style))
    this.applyPaint(`${spec.id}__circle`, circlePaint(spec.style))
    const visibility = spec.visible === false ? 'none' : 'visible'
    for (const sub of this.geojsonLayers.get(spec.id) ?? []) {
      if (map.getLayer(sub)) map.setLayoutProperty(sub, 'visibility', visibility)
    }
  }

  private applyPaint(layerId: string, paint: PaintProps): void {
    const map = this.map
    if (!map || !map.getLayer(layerId)) return
    for (const [property, value] of Object.entries(paint)) {
      map.setPaintProperty(layerId, property, value)
    }
  }

  private addWms(spec: WmsLayerSpec): void {
    const map = this.map
    if (!map) return
    const extra = spec.parameters ?? {}
    const params: Record<string, string> = {
      service: 'WMS',
      request: 'GetMap',
      version: '1.1.1',
      format: 'image/png',
      transparent: 'true',
      width: '256',
      height: '256',
      srs: 'EPSG:3857',
      layers: spec.layers.join(','),
      ...extra,
    }
    const query = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    // The bbox token must stay literal for MapLibre to substitute it per tile.
    const tileUrl = `${spec.url}?${query}&bbox={bbox-epsg-3857}`
    map.addSource(spec.id, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
    } as SourceSpecification)
    const rasterId = `${spec.id}__raster`
    map.addLayer({
      id: rasterId,
      type: 'raster',
      source: spec.id,
      paint: spec.opacity != null ? { 'raster-opacity': spec.opacity } : {},
    } as unknown as AddLayerObject)
    this.rasterLayers.set(spec.id, rasterId)
  }

  private handlePick(event: MapMouseEvent, type: 'click' | 'hover'): void {
    const map = this.map
    if (!map) return
    const layers = [...this.queryable].filter((id) => map.getLayer(id))
    const features = layers.length
      ? (map.queryRenderedFeatures(event.point, { layers }) as MapGeoJSONFeature[])
      : []
    const result: PickResult = {
      position: { lon: event.lngLat.lng, lat: event.lngLat.lat },
    }
    const feature = features[0]
    if (feature) {
      result.layerId = feature.source
      if (feature.id != null) result.featureId = feature.id as string | number
      result.properties = (feature.properties ?? undefined) as Record<string, unknown> | undefined
    }
    this.emitter.emit(type, result)
  }
}

/**
 * Approximate a MapLibre zoom level from a Cesium-style camera height (metres).
 * Heights and zooms aren't strictly convertible (zoom is a ground-resolution
 * scale, height is a camera distance), so this is a deliberately rough mapping
 * for parity with the Cesium adapter; prefer `bbox` targets for precise framing.
 */
function zoomForHeight(height?: number): number {
  if (height == null || height <= 0) return 11
  return Math.max(1, Math.min(20, Math.round(25 - Math.log2(height))))
}
