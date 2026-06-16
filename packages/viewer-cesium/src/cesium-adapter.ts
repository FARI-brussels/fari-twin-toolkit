import {
  BillboardGraphics,
  Cartesian3,
  Cartographic,
  CesiumTerrainProvider,
  Color,
  ColorMaterialProperty,
  ConstantPositionProperty,
  ConstantProperty,
  Cesium3DTileset,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
  Entity,
  GeoJsonDataSource,
  HeadingPitchRange,
  HeadingPitchRoll,
  Ion,
  IonResource,
  ImageryLayer,
  JulianDate,
  Math as CesiumMath,
  Matrix4,
  NearFarScalar,
  Rectangle,
  Resource as CesiumResource,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
  UrlTemplateImageryProvider,
  VerticalOrigin,
  Viewer,
  type Cartesian2,
  type DataSource,
} from 'cesium'
import {
  BaseAdapter,
  resolveFeatureColor,
  type BasemapSpec,
  type CameraControlOptions,
  type CameraState,
  type CameraTarget,
  type FlyOptions,
  type FrameOptions,
  type GeoJsonLayerSpec,
  type LayerKind,
  type FeatureCollection,
  type LayerSpec,
  type Mesh3dLayerSpec,
  type PickResult,
  type PointCloudLayerSpec,
  type RealtimeFeatureStyle,
  type RealtimeLayerSpec,
  type RotateOptions,
  type StyleSpec,
  type Tileset3dLayerSpec,
  type ViewerOpts,
  type WmsLayerSpec,
} from '@fari-brussels/viewer-core'
import { CesiumResourceCache } from './resource-cache'
import { IconAtlasManager } from './icon-atlas'

/** Terrain source for the globe. `'ellipsoid'` is the flat WGS84 default. */
export type CesiumTerrain = 'ellipsoid' | 'world' | { ionAssetId: number }

export interface CesiumAdapterOptions {
  /** Cesium Ion access token (needed for Ion assets / world terrain). */
  ionToken?: string
  /** Extra Viewer construction options to merge over the defaults. */
  viewerOptions?: Viewer.ConstructorOptions
  /** Globe terrain. Defaults to a flat ellipsoid (no Ion token required). */
  terrain?: CesiumTerrain
  /** Drape Cesium OSM Buildings over the globe (requires an Ion token). */
  osmBuildings?: boolean
  /**
   * Render only when the scene changes (Cesium's `requestRenderMode`). Saves
   * GPU on mostly-static maps; the adapter requests a render after every change.
   */
  requestRenderMode?: boolean
}

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const CESIUM_CAPABILITIES: ReadonlySet<LayerKind> = new Set<LayerKind>([
  'geojson',
  'wms',
  'tileset3d',
  'realtime',
  'mesh3d',
  'pointcloud',
])

/** Renders toolkit LayerSpecs on a CesiumJS globe. */
export class CesiumAdapter extends BaseAdapter {
  readonly name = 'cesium'
  readonly capabilities = CESIUM_CAPABILITIES

  private viewer?: Viewer
  private clickHandler?: ScreenSpaceEventHandler
  private baseLayer?: ImageryLayer

  private readonly dataSources = new Map<string, DataSource>()
  private readonly tilesets = new Map<string, Cesium3DTileset>()
  private readonly imagery = new Map<string, ImageryLayer>()
  private readonly entities = new Map<string, Entity>()
  private readonly polls = new Map<string, ReturnType<typeof setInterval>>()
  /** Per-layer camera-move listeners (dynamic polyline widths); id → teardown. */
  private readonly cameraListeners = new Map<string, () => void>()
  /** Reuses expensive Cesium resources (WMS providers, model byte fetches). */
  private readonly resourceCache = new CesiumResourceCache()
  /** Canvas marker images (emoji + circle billboards) for realtime layers. */
  private readonly iconAtlas = new IconAtlasManager()

  constructor(private readonly options: CesiumAdapterOptions = {}) {
    super()
  }

  /** The underlying Cesium Viewer (available after mount). */
  get cesiumViewer(): Viewer | undefined {
    return this.viewer
  }

  protected async onMount(container: HTMLElement, _opts: ViewerOpts): Promise<void> {
    if (this.options.ionToken) Ion.defaultAccessToken = this.options.ionToken
    this.viewer = new Viewer(container, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      requestRenderMode: this.options.requestRenderMode ?? false,
      ...this.options.viewerOptions,
    })
    // The Viewer adds a default Ion imagery base layer; track it as `baseLayer`
    // so that setting an explicit basemap (osm/xyz/none) *replaces* it instead of
    // stacking under it (which would leave Ion's satellite + token watermark on
    // top). Apps that never set a basemap keep the default.
    this.baseLayer =
      this.viewer.imageryLayers.length > 0 ? this.viewer.imageryLayers.get(0) : undefined
    await this.applyTerrain(this.options.terrain)
    if (this.options.osmBuildings) {
      const buildings = await createOsmBuildingsAsync()
      this.viewer.scene.primitives.add(buildings)
    }
    this.clickHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)
    this.clickHandler.setInputAction(
      (event: ScreenSpaceEventHandler.PositionedEvent) => this.handlePick(event.position),
      ScreenSpaceEventType.LEFT_CLICK,
    )
    this.requestRender()
  }

  private async applyTerrain(terrain: CesiumTerrain | undefined): Promise<void> {
    if (!this.viewer || !terrain || terrain === 'ellipsoid') return
    try {
      const provider =
        terrain === 'world'
          ? await createWorldTerrainAsync()
          : await CesiumTerrainProvider.fromUrl(await IonResource.fromAssetId(terrain.ionAssetId))
      if (!this.viewer) return // destroyed while loading
      this.viewer.terrainProvider = provider
      this.viewer.scene.globe.depthTestAgainstTerrain = true
    } catch (err) {
      // A missing/invalid Ion token shouldn't blank the viewer — fall back to
      // the flat ellipsoid the Viewer already has.
      console.warn('[CesiumAdapter] terrain failed to load; using ellipsoid', err)
    }
  }

  /** Nudge Cesium to repaint — a no-op unless `requestRenderMode` is on. */
  private requestRender(): void {
    this.viewer?.scene.requestRender()
  }

  protected onDestroy(): void {
    for (const timer of this.polls.values()) clearInterval(timer)
    this.polls.clear()
    for (const off of this.cameraListeners.values()) off()
    this.cameraListeners.clear()
    this.iconAtlas.clear()
    // Cesium throws DeveloperErrors if torn down in an unexpected state (e.g. an
    // unmount racing an in-flight load). Swallow them so the Vue unmount hook
    // never throws — an escaping error here corrupts Vue's teardown and wedges
    // the app (forcing a manual refresh).
    try {
      this.clickHandler?.destroy()
    } catch {
      /* already gone */
    }
    this.clickHandler = undefined
    try {
      if (this.viewer && !this.viewer.isDestroyed()) this.viewer.destroy()
    } catch (err) {
      console.warn('[CesiumAdapter] viewer teardown error (ignored)', err)
    }
    this.viewer = undefined
    // After the viewer is torn down: any tilesets still in the scene are already
    // destroyed; this releases the ones the cache held out of the scene.
    this.resourceCache.clear()
  }

  /**
   * Warm a glTF/glb model's bytes so a later `mesh3d` placement loads from
   * cache instead of the network. De-duplicated by URL; safe to call early.
   */
  preloadModel(url: string): Promise<void> {
    return this.resourceCache.preloadModel(url)
  }

  protected onAddLayer(spec: LayerSpec): void {
    switch (spec.kind) {
      case 'geojson':
        void this.addGeoJson(spec)
        break
      case 'realtime':
        this.addRealtime(spec)
        break
      case 'wms':
        this.addWms(spec)
        break
      case 'tileset3d':
      case 'pointcloud':
        void this.addTileset(spec)
        break
      case 'mesh3d':
        void this.addMesh(spec)
        break
    }
  }

  protected onUpdateLayer(next: LayerSpec, prev: LayerSpec): void {
    // Fast paths that mutate in place instead of tearing down + rebuilding
    // expensive network/GPU resources (and the visible flicker that causes).
    if (next.kind === 'wms' && prev.kind === 'wms' && this.tryUpdateWms(next, prev)) return
    if (next.kind === 'mesh3d' && prev.kind === 'mesh3d' && this.tryUpdateMesh(next, prev)) return
    // Fallback: rebuild. The cache still spares us re-creating identical WMS
    // providers and re-fetching identical model bytes underneath.
    this.onRemoveLayer(prev)
    this.onAddLayer(next)
  }

  /** True when two WMS specs resolve to the same cached imagery provider. */
  private wmsProviderUnchanged(a: WmsLayerSpec, b: WmsLayerSpec): boolean {
    return (
      a.url === b.url &&
      a.layers.join(',') === b.layers.join(',') &&
      (a.crs ?? 'CRS:84') === (b.crs ?? 'CRS:84') &&
      JSON.stringify(a.parameters ?? {}) === JSON.stringify(b.parameters ?? {})
    )
  }

  /**
   * Update a WMS layer in place when only its opacity changed (provider config
   * identical) — just retune the layer's alpha, no tile reload. Returns false to
   * let the caller rebuild when the provider itself differs.
   */
  private tryUpdateWms(next: WmsLayerSpec, prev: WmsLayerSpec): boolean {
    const layer = this.imagery.get(next.id)
    if (!layer || !this.wmsProviderUnchanged(next, prev)) return false
    layer.alpha = next.opacity ?? 1
    this.requestRender()
    return true
  }

  /**
   * Update a mesh in place when the model URL is unchanged — move/rescale the
   * existing entity instead of reloading the glTF. Returns false (→ rebuild)
   * when the URL changed.
   */
  private tryUpdateMesh(next: Mesh3dLayerSpec, prev: Mesh3dLayerSpec): boolean {
    // Only the cheap transform moves fast-path; model/orientation/sizing changes
    // rebuild (the cache makes the model reload a hit anyway).
    const sameModel =
      next.url === prev.url &&
      JSON.stringify(next.orientation ?? {}) === JSON.stringify(prev.orientation ?? {}) &&
      next.minimumPixelSize === prev.minimumPixelSize &&
      next.maximumScale === prev.maximumScale
    if (!sameModel) return false
    const entity = this.entities.get(next.id)
    if (!entity) return false
    entity.position = new ConstantPositionProperty(
      Cartesian3.fromDegrees(next.position.lon, next.position.lat, next.position.height ?? 0),
    )
    if (entity.model) entity.model.scale = new ConstantProperty(next.scale ?? 1)
    this.requestRender()
    return true
  }

  protected onRemoveLayer(spec: LayerSpec): void {
    const id = spec.id
    const ds = this.dataSources.get(id)
    if (ds) {
      this.viewer?.dataSources.remove(ds, true)
      this.dataSources.delete(id)
    }
    const tileset = this.tilesets.get(id)
    if (tileset) {
      // Take it out of the scene without destroying — the resource cache owns
      // the instance so re-showing the same tileset doesn't re-fetch it.
      this.removeTilesetFromScene(tileset)
      this.tilesets.delete(id)
    }
    const layer = this.imagery.get(id)
    if (layer) {
      this.viewer?.imageryLayers.remove(layer, true)
      this.imagery.delete(id)
    }
    const entity = this.entities.get(id)
    if (entity) {
      this.viewer?.entities.remove(entity)
      this.entities.delete(id)
    }
    const timer = this.polls.get(id)
    if (timer) {
      clearInterval(timer)
      this.polls.delete(id)
    }
    this.cameraListeners.get(id)?.()
    this.cameraListeners.delete(id)
    this.requestRender()
  }

  protected onSetBasemap(spec: BasemapSpec | null): void {
    if (!this.viewer) return
    if (this.baseLayer) {
      this.viewer.imageryLayers.remove(this.baseLayer, true)
      this.baseLayer = undefined
    }
    if (!spec || spec.kind === 'none') return
    const url = spec.kind === 'xyz' ? spec.url : OSM_URL
    if (!url) return
    const layer = this.viewer.imageryLayers.addImageryProvider(
      // OSM only serves up to zoom 19; capping avoids failed/CORS-blocked
      // requests for non-existent level 20–21 tiles when zoomed in close.
      new UrlTemplateImageryProvider(spec.kind === 'osm' ? { url, maximumLevel: 19 } : { url }),
    )
    this.viewer.imageryLayers.lowerToBottom(layer)
    this.baseLayer = layer
    this.requestRender()
  }

  protected async onFlyTo(target: CameraTarget, opts: FlyOptions): Promise<void> {
    if (!this.viewer) return
    const duration = opts.durationMs != null ? opts.durationMs / 1000 : undefined
    if (target.bbox) {
      const [w, s, e, n] = target.bbox
      this.viewer.camera.flyTo({ destination: Rectangle.fromDegrees(w, s, e, n), duration })
      this.requestRender()
      return
    }
    if (target.center) {
      const destination = Cartesian3.fromDegrees(
        target.center.lon,
        target.center.lat,
        target.height ?? 2000,
      )
      // Honor heading/pitch when given; otherwise let Cesium keep its top-down default.
      const orientation =
        target.heading != null || target.pitch != null
          ? {
              heading: CesiumMath.toRadians(target.heading ?? 0),
              pitch: CesiumMath.toRadians(target.pitch ?? -90),
              roll: 0,
            }
          : undefined
      this.viewer.camera.flyTo({ destination, duration, orientation })
      this.requestRender()
    }
  }

  // --- camera nudges (override BaseAdapter's no-op defaults) ---

  override zoomBy(factor: number): void {
    const camera = this.viewer?.camera
    if (!camera) return
    const delta = camera.positionCartographic.height * Math.abs(factor)
    if (factor >= 0) camera.zoomIn(delta)
    else camera.zoomOut(delta)
    this.requestRender()
  }

  override rotateBy(deltaDegrees: number, opts: RotateOptions = {}): void {
    const camera = this.viewer?.camera
    if (!camera) return
    const heading = CesiumMath.toDegrees(camera.heading) + deltaDegrees
    const orientation = {
      heading: CesiumMath.toRadians(heading),
      pitch: camera.pitch,
      roll: 0,
    }
    if (opts.animate ?? true) {
      camera.flyTo({ destination: camera.position, orientation, duration: 0.5 })
    } else {
      camera.setView({ destination: camera.position, orientation })
    }
    this.requestRender()
  }

  override configureControls(opts: CameraControlOptions): void {
    const controller = this.viewer?.scene.screenSpaceCameraController
    if (!controller) return
    controller.enableRotate = opts.enableRotate ?? true
    controller.enableZoom = opts.enableZoom ?? true
    controller.enableTilt = opts.enableTilt ?? true
    controller.enableLook = opts.enableLook ?? true
  }

  override getCameraState(): CameraState | null {
    const camera = this.viewer?.camera
    if (!camera) return null
    const carto = camera.positionCartographic
    return {
      center: {
        lon: CesiumMath.toDegrees(carto.longitude),
        lat: CesiumMath.toDegrees(carto.latitude),
      },
      height: carto.height,
      heading: CesiumMath.toDegrees(camera.heading),
      pitch: CesiumMath.toDegrees(camera.pitch),
    }
  }

  // --- layer builders ---

  private async addGeoJson(spec: GeoJsonLayerSpec): Promise<void> {
    const ds = await GeoJsonDataSource.load(spec.data, this.geoJsonOptions(spec.style))
    if (!this.viewer || !this.getSpec(spec.id)) return // removed before load resolved
    this.applyColorByStyle(ds, spec.style)
    await this.viewer.dataSources.add(ds)
    this.dataSources.set(spec.id, ds)
    this.requestRender()
  }

  private addRealtime(spec: RealtimeLayerSpec): void {
    const load = async () => {
      this.emitter.emit('layerStatus', { id: spec.id, status: 'loading' })
      try {
        const data = await this.fetchRealtime(spec)
        if (!this.viewer || !this.getSpec(spec.id)) return
        // Transparent default markers; per-feature look is applied below.
        const ds = await GeoJsonDataSource.load(data, {
          ...this.geoJsonOptions(spec.style),
          clampToGround: spec.clampToGround ?? true,
          markerColor: Color.TRANSPARENT,
          markerSize: 0,
          markerSymbol: '',
        })
        if (!this.viewer || !this.getSpec(spec.id)) return
        this.styleRealtimeEntities(ds, spec)
        const previous = this.dataSources.get(spec.id)
        if (previous) this.viewer.dataSources.remove(previous, true)
        await this.viewer.dataSources.add(ds)
        this.dataSources.set(spec.id, ds)
        if (spec.dynamicLineWidth) this.setupDynamicLineWidth(spec.id, ds)
        this.emitter.emit('layerStatus', {
          id: spec.id,
          status: 'loaded',
          featureCount: ds.entities.values.length,
        })
        this.requestRender()
      } catch (err) {
        this.emitter.emit('layerStatus', {
          id: spec.id,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
    void load()
    if (spec.pollSeconds && spec.pollSeconds > 0) {
      this.polls.set(
        spec.id,
        setInterval(() => void load(), spec.pollSeconds * 1000),
      )
    }
  }

  /** Resolve realtime input: the app's authed `fetchFeatures`, else the URL. */
  private async fetchRealtime(spec: RealtimeLayerSpec): Promise<FeatureCollection | string> {
    if (spec.fetchFeatures) {
      const fc = await spec.fetchFeatures()
      return spec.normalizeCoordinates ? normalizeFeatureCoordinates(fc) : fc
    }
    if (spec.endpoint) return spec.endpoint
    throw new Error(`Realtime layer "${spec.id}" has neither fetchFeatures nor endpoint`)
  }

  /**
   * Style each loaded entity from the per-feature callback. Falls back to the
   * declarative `style.colorBy` path when no `styleFeature` is given. Events are
   * suspended during the walk so the data source repaints once, not per entity.
   */
  private styleRealtimeEntities(ds: GeoJsonDataSource, spec: RealtimeLayerSpec): void {
    const styleFeature = spec.styleFeature
    if (!styleFeature) {
      this.applyColorByStyle(ds, spec.style)
      return
    }
    const time = JulianDate.now()
    ds.entities.suspendEvents()
    try {
      for (const entity of ds.entities.values) {
        const props = entity.properties
          ? (entity.properties.getValue(time) as Record<string, unknown>)
          : {}
        this.applyRealtimeFeatureStyle(entity, styleFeature(props ?? {}) ?? {}, spec)
      }
    } finally {
      ds.entities.resumeEvents()
    }
  }

  /** Turn one {@link RealtimeFeatureStyle} into Cesium graphics for an entity. */
  private applyRealtimeFeatureStyle(
    entity: Entity,
    style: RealtimeFeatureStyle,
    spec: RealtimeLayerSpec,
  ): void {
    const color = style.color ? Color.fromCssColorString(style.color) : undefined
    const size = style.sizePx ?? 40

    // Emoji icon billboard.
    if (style.emoji) {
      entity.billboard = new BillboardGraphics({
        image: this.iconAtlas.createEmojiIcon(style.emoji, 128),
        width: size,
        height: size,
        verticalOrigin: VerticalOrigin.BOTTOM,
        scaleByDistance: new NearFarScalar(500, 1.2, 8000, 0.4),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })
      entity.point = undefined
      return
    }

    // Point → tinted shared circle billboard (one texture for all points).
    if (entity.position && !entity.polyline && !entity.polygon) {
      entity.billboard = new BillboardGraphics({
        image: this.iconAtlas.createSharedCircle(14, 4),
        width: size,
        height: size,
        color: color ?? Color.YELLOW.withAlpha(0.9),
        verticalOrigin: VerticalOrigin.BOTTOM,
        scaleByDistance: new NearFarScalar(500, 1.2, 10000, 0.5),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })
      entity.point = undefined
      return
    }

    // Polyline (e.g. traffic density).
    if (entity.polyline) {
      if (color) entity.polyline.material = new ColorMaterialProperty(color)
      const width = style.lineWidth ?? (spec.dynamicLineWidth ? this.dynamicLineWidth() : 4)
      entity.polyline.width = new ConstantProperty(width)
      return
    }

    // Polygon.
    if (entity.polygon) {
      if (color) entity.polygon.material = new ColorMaterialProperty(color)
      entity.polygon.outline = new ConstantProperty(true)
      entity.polygon.outlineColor = new ConstantProperty(Color.WHITE)
      entity.polygon.outlineWidth = new ConstantProperty(2)
    }
  }

  /** Polyline width bucketed by current camera height (closer ⇒ thicker). */
  private dynamicLineWidth(): number {
    const h = this.viewer?.camera.positionCartographic.height ?? 5000
    if (h < 500) return 8
    if (h < 2000) return 6
    if (h < 10000) return 5
    return 3
  }

  /**
   * Rescale a layer's polyline widths as the camera moves (debounced, and only
   * when the height changed enough to matter). Replaces any prior listener for
   * the same layer; torn down on remove/destroy.
   */
  private setupDynamicLineWidth(id: string, ds: GeoJsonDataSource): void {
    const viewer = this.viewer
    if (!viewer) return
    this.cameraListeners.get(id)?.()
    let timer: ReturnType<typeof setTimeout> | null = null
    let lastHeight: number | null = null
    const update = () => {
      const h = viewer.camera.positionCartographic.height
      if (lastHeight !== null && Math.abs(h - lastHeight) / lastHeight < 0.1) return
      lastHeight = h
      const width = this.dynamicLineWidth()
      ds.entities.suspendEvents()
      for (const e of ds.entities.values) {
        if (e.polyline) e.polyline.width = new ConstantProperty(width)
      }
      ds.entities.resumeEvents()
      this.requestRender()
    }
    const onMoveEnd = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(update, 100)
    }
    viewer.camera.moveEnd.addEventListener(onMoveEnd)
    this.cameraListeners.set(id, () => {
      viewer.camera.moveEnd.removeEventListener(onMoveEnd)
      if (timer) clearTimeout(timer)
    })
  }

  /**
   * Apply per-feature coloring from `style.colorBy`. GeoJsonDataSource.load
   * accepts a uniform fill, but a choropleth needs each polygon colored from
   * its own properties — that's done here, after load, by walking the entities
   * and pulling the value via `resolveFeatureColor` (the same helper viewer-core
   * tests cover). No-op when `colorBy` isn't set.
   */
  private applyColorByStyle(ds: GeoJsonDataSource, style?: StyleSpec): void {
    if (!style?.colorBy) return
    const time = JulianDate.now()
    const strokeColor = style.strokeColor ? Color.fromCssColorString(style.strokeColor) : undefined
    for (const entity of ds.entities.values) {
      const props = entity.properties
        ? (entity.properties.getValue(time) as Record<string, unknown>)
        : {}
      const hex = resolveFeatureColor(style, props)
      if (!hex) continue
      const color = Color.fromCssColorString(hex)
      if (!color) continue
      const material = new ColorMaterialProperty(color)
      if (entity.polygon) {
        entity.polygon.material = material
        if (strokeColor) {
          entity.polygon.outline = new ConstantProperty(true)
          entity.polygon.outlineColor = new ConstantProperty(strokeColor)
        }
      }
      if (entity.polyline) entity.polyline.material = material
      if (entity.point) entity.point.color = new ConstantProperty(color)
      if (entity.billboard) entity.billboard.color = new ConstantProperty(color)
    }
  }

  private addWms(spec: WmsLayerSpec): void {
    if (!this.viewer) return
    // Reuse a cached provider for identical requests (the DT's UrbIS overlay and
    // map layers hit the same WMS repeatedly); the cache also supplies the
    // WMS 1.3.0 + CRS:84 defaults Cesium needs for correct axis order.
    const provider = this.resourceCache.getWmsProvider(
      spec.url,
      spec.layers.join(','),
      spec.parameters,
      spec.crs,
      {
        maximumLevel: spec.maximumLevel,
        tileWidth: spec.tileWidth,
        tileHeight: spec.tileHeight,
      },
    )
    const layer = this.viewer.imageryLayers.addImageryProvider(provider)
    layer.alpha = spec.opacity ?? 1
    this.imagery.set(spec.id, layer)
    this.requestRender()
  }

  private async addTileset(spec: Tileset3dLayerSpec | PointCloudLayerSpec): Promise<void> {
    const id = spec.id
    this.emitter.emit('layerStatus', { id, status: 'loading' })
    try {
      const tileset = await this.loadOrReuseTileset(spec)
      if (!this.viewer || !this.getSpec(id)) return
      if (!this.viewer.scene.primitives.contains(tileset)) {
        this.viewer.scene.primitives.add(tileset)
      }
      this.tilesets.set(id, tileset)

      const frame = 'frame' in spec ? spec.frame : undefined
      if (frame) {
        // Wait a frame so the tileset's bounding sphere is populated before framing.
        await new Promise((resolve) => requestAnimationFrame(resolve))
        if (!this.viewer || !this.getSpec(id)) return
        this.frameTileset(tileset, frame)
      }
      this.requestRender()
      this.emitter.emit('layerStatus', { id, status: 'loaded' })
    } catch (err) {
      this.emitter.emit('layerStatus', {
        id,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  /** Resource key identifying a tileset (Ion asset or URL) for the cache. */
  private tilesetKey(spec: Tileset3dLayerSpec | PointCloudLayerSpec): string {
    const ionAssetId = 'ionAssetId' in spec ? spec.ionAssetId : undefined
    return ionAssetId != null ? `ion:${ionAssetId}` : (spec.url ?? '')
  }

  /** Reuse a cached tileset, else load it (Ion / authed URL / plain URL) and cache it. */
  private async loadOrReuseTileset(
    spec: Tileset3dLayerSpec | PointCloudLayerSpec,
  ): Promise<Cesium3DTileset> {
    const key = this.tilesetKey(spec)
    const cached = this.resourceCache.getTileset(key)
    if (cached) return cached

    const sse = 'maximumScreenSpaceError' in spec ? spec.maximumScreenSpaceError : undefined
    const options = {
      maximumScreenSpaceError: sse ?? 16,
      skipLevelOfDetail: true,
      dynamicScreenSpaceError: true,
    }
    const ionAssetId = 'ionAssetId' in spec ? spec.ionAssetId : undefined

    let tileset: Cesium3DTileset
    if (ionAssetId != null) {
      tileset = await Cesium3DTileset.fromIonAssetId(ionAssetId, options)
    } else {
      if (!spec.url) throw new Error(`Tileset "${spec.id}" has neither url nor ionAssetId`)
      const headers = 'getHeaders' in spec && spec.getHeaders ? await spec.getHeaders() : undefined
      const resource = headers ? new CesiumResource({ url: spec.url, headers }) : spec.url
      tileset = await Cesium3DTileset.fromUrl(resource, options)
    }
    this.resourceCache.setTileset(key, tileset)
    return tileset
  }

  /** Point the camera at a tileset's bounding sphere (lookAt, then release transform). */
  private frameTileset(tileset: Cesium3DTileset, frame: FrameOptions): void {
    if (!this.viewer) return
    const sphere = tileset.boundingSphere
    if (!sphere) return
    this.viewer.camera.lookAt(
      sphere.center,
      new HeadingPitchRange(
        CesiumMath.toRadians(frame.heading ?? 0),
        CesiumMath.toRadians(frame.pitch ?? -30),
        sphere.radius * (frame.distanceMultiplier ?? 2.5),
      ),
    )
    // Release the reference frame so subsequent free-camera controls work.
    this.viewer.camera.lookAtTransform(Matrix4.IDENTITY)
    this.requestRender()
  }

  /** Remove a tileset from the scene without destroying it (the cache owns it). */
  private removeTilesetFromScene(tileset: Cesium3DTileset): void {
    const prims = this.viewer?.scene.primitives
    if (!prims || !prims.contains(tileset)) return
    const prev = prims.destroyPrimitives
    prims.destroyPrimitives = false
    prims.remove(tileset)
    prims.destroyPrimitives = prev
  }

  override frameLayer(id: string, opts: FrameOptions = {}): void {
    const tileset = this.tilesets.get(id)
    if (tileset) {
      this.frameTileset(tileset, opts)
      return
    }
    const entity = this.entities.get(id)
    if (entity) this.frameMesh(entity, opts)
  }

  private async addMesh(spec: Mesh3dLayerSpec): Promise<void> {
    if (!this.viewer) return
    this.emitter.emit('layerStatus', { id: spec.id, status: 'loading' })
    try {
      // Warm the glTF bytes so the model pops in without a flash, then place it.
      await this.resourceCache.preloadModel(spec.url)
      if (!this.viewer || !this.getSpec(spec.id)) return

      const position = Cartesian3.fromDegrees(
        spec.position.lon,
        spec.position.lat,
        spec.position.height ?? 0,
      )
      const entity = this.viewer.entities.add({
        position,
        orientation: this.meshOrientation(position, spec.orientation),
        model: {
          uri: spec.url,
          scale: spec.scale ?? 1,
          minimumPixelSize: spec.minimumPixelSize ?? 64,
          maximumScale: spec.maximumScale,
        },
      })
      this.entities.set(spec.id, entity)

      if (spec.frame) {
        await new Promise((resolve) => requestAnimationFrame(resolve))
        if (!this.viewer || !this.getSpec(spec.id)) return
        this.frameMesh(entity, spec.frame)
      }
      this.requestRender()
      this.emitter.emit('layerStatus', { id: spec.id, status: 'loaded' })
    } catch (err) {
      this.emitter.emit('layerStatus', {
        id: spec.id,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  /** Quaternion orientation from heading/pitch/roll degrees, or undefined. */
  private meshOrientation(
    position: Cartesian3,
    rotation: Mesh3dLayerSpec['orientation'],
  ): ConstantProperty | undefined {
    if (!rotation) return undefined
    return new ConstantProperty(
      Transforms.headingPitchRollQuaternion(
        position,
        new HeadingPitchRoll(
          CesiumMath.toRadians(rotation.heading ?? 0),
          CesiumMath.toRadians(rotation.pitch ?? 0),
          CesiumMath.toRadians(rotation.roll ?? 0),
        ),
      ),
    )
  }

  /** Point the camera at a placed model (absolute `frame.distance`). */
  private frameMesh(entity: Entity, frame: FrameOptions): void {
    if (!this.viewer) return
    const position = entity.position?.getValue(JulianDate.now())
    if (!position) return
    this.viewer.camera.lookAt(
      position,
      new HeadingPitchRange(
        CesiumMath.toRadians(frame.heading ?? 0),
        CesiumMath.toRadians(frame.pitch ?? -30),
        frame.distance ?? 80,
      ),
    )
    this.viewer.camera.lookAtTransform(Matrix4.IDENTITY)
    this.requestRender()
  }

  private geoJsonOptions(style?: StyleSpec): GeoJsonDataSource.LoadOptions {
    const options: GeoJsonDataSource.LoadOptions = {}
    if (style?.strokeColor) {
      const c = Color.fromCssColorString(style.strokeColor)
      if (c) options.stroke = c
    }
    if (style?.fillColor) {
      const c = Color.fromCssColorString(style.fillColor)
      if (c) options.fill = c
    }
    if (style?.strokeWidth != null) options.strokeWidth = style.strokeWidth
    return options
  }

  private handlePick(position: Cartesian2): void {
    if (!this.viewer) return
    const result: PickResult = {}
    const cartesian = this.viewer.scene.pickPosition(position)
    if (cartesian) {
      const carto = Cartographic.fromCartesian(cartesian)
      result.position = {
        lon: CesiumMath.toDegrees(carto.longitude),
        lat: CesiumMath.toDegrees(carto.latitude),
        height: carto.height,
      }
    }
    const picked = this.viewer.scene.pick(position) as { id?: unknown } | undefined
    if (picked && picked.id instanceof Entity) {
      result.featureId = picked.id.id
      const props = picked.id.properties
      if (props) result.properties = props.getValue(this.viewer.clock.currentTime)
    }
    this.emitter.emit('click', result)
  }
}

/** Recursively coerce stringified numbers to numbers, preserving structure. */
function coerceCoords(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(coerceCoords)
  if (typeof value === 'string') {
    const n = Number.parseFloat(value)
    return Number.isNaN(n) ? value : n
  }
  return value
}

/**
 * Some realtime feeds return coordinates as strings (`"4.35"`). Coerce them to
 * numbers so Cesium can place the features. Geometries without `coordinates`
 * (e.g. GeometryCollection) pass through untouched.
 */
function normalizeFeatureCoordinates(fc: FeatureCollection): FeatureCollection {
  return {
    ...fc,
    features: fc.features.map((feature) => {
      const geometry = feature.geometry as { coordinates?: unknown } | null
      if (!geometry || !('coordinates' in geometry)) return feature
      return {
        ...feature,
        geometry: { ...geometry, coordinates: coerceCoords(geometry.coordinates) },
      } as typeof feature
    }),
  }
}
