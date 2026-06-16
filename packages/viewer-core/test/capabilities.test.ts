import { describe, it, expect } from 'vitest'
import {
  supports,
  assertSupported,
  selectAdapter,
  type AdapterDescriptor,
} from '../src/capabilities'
import { UnsupportedLayerError } from '../src/errors'
import type { LayerKind } from '../src/layer-spec'

const holder = (name: string, caps: LayerKind[]) => ({ name, capabilities: new Set(caps) })

describe('capability checks', () => {
  it('supports() reflects the capability set', () => {
    const h = holder('x', ['geojson', 'wms'])
    expect(supports(h, 'geojson')).toBe(true)
    expect(supports(h, 'tileset3d')).toBe(false)
  })

  it('assertSupported throws for missing kinds', () => {
    const h = holder('x', ['geojson'])
    expect(() => assertSupported(h, 'tileset3d')).toThrow(UnsupportedLayerError)
  })
})

describe('selectAdapter', () => {
  const noop = () => ({}) as never
  const leaflet: AdapterDescriptor = {
    name: 'leaflet',
    capabilities: new Set<LayerKind>(['geojson', 'wms']),
    create: noop,
  }
  const cesium: AdapterDescriptor = {
    name: 'cesium',
    capabilities: new Set<LayerKind>([
      'geojson',
      'wms',
      'tileset3d',
      'realtime',
      'mesh3d',
      'pointcloud',
    ]),
    create: noop,
  }

  it('picks the cheapest (first) adapter that covers all required kinds', () => {
    // 2D dashboard needs only geojson+wms -> the light one wins
    expect(selectAdapter([leaflet, cesium], ['geojson', 'wms'])?.name).toBe('leaflet')
    // needs 3D tiles -> falls through to cesium
    expect(selectAdapter([leaflet, cesium], ['geojson', 'tileset3d'])?.name).toBe('cesium')
  })

  it('returns undefined when nothing covers the requirements', () => {
    expect(selectAdapter([leaflet], ['tileset3d'])).toBeUndefined()
  })
})
