import { Cesium3DTileset, Resource, WebMapServiceImageryProvider } from 'cesium'

/** Extra Cesium WMS provider options that affect tile geometry/resolution. */
export interface WmsProviderOptions {
  maximumLevel?: number
  tileWidth?: number
  tileHeight?: number
}

/**
 * Caches expensive, reusable Cesium resources so repeated layer add/update
 * cycles don't rebuild them. Pure Cesium + TypeScript — no framework coupling.
 *
 * - **WMS providers** — a `WebMapServiceImageryProvider` is a stateless tile
 *   _describer_ (it just computes tile request URLs), safe to share across
 *   imagery layers. Rebuilding one on every `updateLayer` (e.g. an opacity
 *   tweak) needlessly throws away its request pipeline; caching by request
 *   identity avoids that and removes the tile-reload flicker.
 * - **Model preloads** — de-duplicates glTF/glb byte fetches so the same model
 *   URL is only pulled over the wire once; later placements are cache hits.
 * - **Tilesets** — a loaded `Cesium3DTileset` is expensive (network + parse);
 *   caching by resource key lets a viewer re-show one without re-fetching. Owned
 *   here, so the cache (not per-layer removal) decides when to `destroy()`.
 */
export class CesiumResourceCache {
  private readonly wmsProviders = new Map<string, WebMapServiceImageryProvider>()
  private readonly modelPreloads = new Map<string, Promise<void>>()
  private readonly tilesets = new Map<string, Cesium3DTileset>()

  /** Stable key for a WMS request: same url + layers + params + crs ⇒ same provider. */
  private wmsKey(
    url: string,
    layers: string,
    parameters: Record<string, string>,
    crs: string,
  ): string {
    const sorted = Object.keys(parameters)
      .sort()
      .reduce<Record<string, string>>((acc, k) => {
        acc[k] = parameters[k]!
        return acc
      }, {})
    return `${url}|${layers}|${crs}|${JSON.stringify(sorted)}`
  }

  /**
   * Get (or build + cache) a WMS imagery provider. Applies the defaults that
   * make Cesium render WMS correctly — WMS **1.3.0** with **`CRS:84`** (lon/lat
   * axis order, matching Cesium's BBOX) — which callers can override via
   * `parameters` / `crs`.
   */
  getWmsProvider(
    url: string,
    layers: string,
    parameters: Record<string, string> = {},
    crs = 'CRS:84',
    options: WmsProviderOptions = {},
  ): WebMapServiceImageryProvider {
    const merged: Record<string, string> = {
      transparent: 'true',
      format: 'image/png',
      version: '1.3.0',
      ...parameters,
    }
    const { maximumLevel, tileWidth, tileHeight } = options
    const key = `${this.wmsKey(url, layers, merged, crs)}|${maximumLevel ?? ''}|${tileWidth ?? ''}|${tileHeight ?? ''}`
    let provider = this.wmsProviders.get(key)
    if (!provider) {
      provider = new WebMapServiceImageryProvider({
        url,
        layers,
        crs,
        parameters: merged,
        ...(maximumLevel != null ? { maximumLevel } : {}),
        ...(tileWidth != null ? { tileWidth } : {}),
        ...(tileHeight != null ? { tileHeight } : {}),
      })
      this.wmsProviders.set(key, provider)
    }
    return provider
  }

  /** A previously cached tileset for this key, if still alive. */
  getTileset(key: string): Cesium3DTileset | undefined {
    const t = this.tilesets.get(key)
    if (t && t.isDestroyed()) {
      this.tilesets.delete(key)
      return undefined
    }
    return t
  }

  /** Remember a loaded tileset under a resource key. */
  setTileset(key: string, tileset: Cesium3DTileset): void {
    this.tilesets.set(key, tileset)
  }

  /**
   * Warm a model's bytes into Cesium's resource cache, de-duplicated by URL.
   * Safe to call repeatedly — the fetch happens once; subsequent calls return
   * the same in-flight (or settled) promise. A failed fetch is evicted so it can
   * be retried later.
   */
  preloadModel(url: string): Promise<void> {
    const existing = this.modelPreloads.get(url)
    if (existing) return existing
    const fetched = Resource.fetchArrayBuffer({ url }) ?? Promise.resolve(new ArrayBuffer(0))
    const promise = fetched
      .then(() => undefined)
      .catch((err: unknown) => {
        this.modelPreloads.delete(url)
        throw err
      })
    this.modelPreloads.set(url, promise)
    return promise
  }

  /**
   * Drop all cached references. WMS providers and preloads hold no GPU memory of
   * their own; cached tilesets do, so they're destroyed here (called on adapter
   * destroy, after the viewer is torn down).
   */
  clear(): void {
    this.wmsProviders.clear()
    this.modelPreloads.clear()
    for (const tileset of this.tilesets.values()) {
      if (!tileset.isDestroyed()) tileset.destroy()
    }
    this.tilesets.clear()
  }
}
