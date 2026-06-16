import type { Asset, RealtimeDataset, Tileset, WmsLayer } from '@fari-brussels/twin-types'
import type {
  Mesh3dLayerSpec,
  RealtimeLayerSpec,
  Tileset3dLayerSpec,
  WmsLayerSpec,
} from './layer-spec'

/**
 * Mappers across the data/render seam: take a wire-format resource
 * (@fari-brussels/twin-types, snake_case) and produce a LayerSpec (camelCase) the viewer
 * can draw.
 */

export function layerFromWmsLayer(w: WmsLayer, id?: string): WmsLayerSpec {
  return {
    id: id ?? `wms:${w.url}:${w.layer}`,
    kind: 'wms',
    url: w.url,
    layers: [w.layer],
  }
}

export function layerFromTileset(t: Tileset, id?: string): Tileset3dLayerSpec {
  return {
    id: id ?? `tileset:${t.id}`,
    kind: 'tileset3d',
    url: t.tileset_url,
  }
}

export function layerFromRealtimeDataset(d: RealtimeDataset, id?: string): RealtimeLayerSpec {
  return {
    id: id ?? `realtime:${d.id}`,
    kind: 'realtime',
    endpoint: d.endpoint,
    sourceKind: d.source_kind,
    pollSeconds: d.poll_seconds ?? undefined,
  }
}

export function layerFromAsset(
  a: Asset,
  position: Mesh3dLayerSpec['position'],
  id?: string,
): Mesh3dLayerSpec {
  return {
    id: id ?? `asset:${a.id}`,
    kind: 'mesh3d',
    url: a.url,
    position,
  }
}
