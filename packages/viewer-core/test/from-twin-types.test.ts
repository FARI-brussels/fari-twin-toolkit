import { describe, it, expect } from 'vitest'
import {
  layerFromWmsLayer,
  layerFromTileset,
  layerFromRealtimeDataset,
} from '../src/from-twin-types'
import type { RealtimeDataset, Tileset, WmsLayer } from '@fari-brussels/twin-types'

describe('twin-types -> LayerSpec mappers', () => {
  it('maps a WmsLayer', () => {
    const w: WmsLayer = { url: 'https://geo.example/wms', layer: 'buildings' }
    expect(layerFromWmsLayer(w)).toEqual({
      id: 'wms:https://geo.example/wms:buildings',
      kind: 'wms',
      url: 'https://geo.example/wms',
      layers: ['buildings'],
    })
  })

  it('maps a Tileset', () => {
    const t: Tileset = { id: 7, name: 'City', tileset_url: 'https://t.example/tileset.json' }
    expect(layerFromTileset(t)).toEqual({
      id: 'tileset:7',
      kind: 'tileset3d',
      url: 'https://t.example/tileset.json',
    })
  })

  it('maps a RealtimeDataset, normalizing null poll_seconds', () => {
    const d: RealtimeDataset = {
      id: 'stib',
      name: 'STIB',
      endpoint: 'https://api.example/stib',
      source_kind: 'stib',
      poll_seconds: null,
    }
    const spec = layerFromRealtimeDataset(d)
    expect(spec).toMatchObject({
      id: 'realtime:stib',
      kind: 'realtime',
      endpoint: 'https://api.example/stib',
      sourceKind: 'stib',
    })
    expect(spec.pollSeconds).toBeUndefined()
  })
})
