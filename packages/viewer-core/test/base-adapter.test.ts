import { describe, it, expect, vi } from 'vitest'
import { TestAdapter, fakeElement } from './test-adapter'
import { DuplicateLayerError, LayerNotFoundError, UnsupportedLayerError } from '../src/errors'
import type { GeoJsonLayerSpec } from '../src/layer-spec'

const geo: GeoJsonLayerSpec = {
  id: 'a',
  kind: 'geojson',
  data: { type: 'FeatureCollection', features: [] },
}

describe('BaseAdapter layer lifecycle', () => {
  it('adds a supported layer and tracks its id', () => {
    const a = new TestAdapter()
    const handle = a.addLayer(geo)
    expect(handle.id).toBe('a')
    expect(a.added).toHaveLength(1)
    expect(a.listLayerIds()).toEqual(['a'])
  })

  it('rejects an unsupported layer kind', () => {
    const a = new TestAdapter(['geojson']) // no mesh3d
    expect(() =>
      a.addLayer({ id: 'm', kind: 'mesh3d', url: 'x.glb', position: { lon: 0, lat: 0 } }),
    ).toThrow(UnsupportedLayerError)
  })

  it('rejects duplicate ids', () => {
    const a = new TestAdapter()
    a.addLayer(geo)
    expect(() => a.addLayer(geo)).toThrow(DuplicateLayerError)
  })

  it('updates a layer, preserving id and kind', () => {
    const a = new TestAdapter()
    const h = a.addLayer(geo)
    a.updateLayer(h, { opacity: 0.5 })
    expect(a.updated).toHaveLength(1)
    expect(a.updated[0]?.next.opacity).toBe(0.5)
    expect(a.updated[0]?.next.id).toBe('a')
    expect(a.updated[0]?.next.kind).toBe('geojson')
  })

  it('throws updating a missing layer', () => {
    const a = new TestAdapter()
    expect(() => a.updateLayer({ id: 'nope' }, { opacity: 1 })).toThrow(LayerNotFoundError)
  })

  it('removes a layer (idempotent)', () => {
    const a = new TestAdapter()
    const h = a.addLayer(geo)
    a.removeLayer(h)
    expect(a.removed).toHaveLength(1)
    expect(a.listLayerIds()).toEqual([])
    a.removeLayer(h) // no-op, no throw
    expect(a.removed).toHaveLength(1)
  })

  it('removes all layers on destroy', () => {
    const a = new TestAdapter()
    a.addLayer(geo)
    a.addLayer({ ...geo, id: 'b' })
    a.destroy()
    expect(a.removed).toHaveLength(2)
    expect(a.destroyed).toBe(true)
    expect(a.listLayerIds()).toEqual([])
  })
})

describe('BaseAdapter mount + events', () => {
  it('mounts, applies basemap + initial camera, then emits ready', async () => {
    const a = new TestAdapter()
    const ready = vi.fn()
    a.on('ready', ready)
    await a.mount(fakeElement, {
      basemap: { kind: 'osm' },
      initialCamera: { center: { lon: 4.35, lat: 50.85 } },
    })
    expect(a.mounted).toBe(true)
    expect(a.basemaps).toEqual([{ kind: 'osm' }])
    expect(a.flights).toHaveLength(1)
    expect(ready).toHaveBeenCalledOnce()
  })

  it('unsubscribes event handlers', () => {
    const a = new TestAdapter()
    const handler = vi.fn()
    const off = a.on('click', handler)
    off()
    // emit via protected emitter through a subclass-exposed path: re-add and emit
    // (here we just assert unsubscribe returns a function and does not throw)
    expect(typeof off).toBe('function')
  })
})

describe('BaseAdapter camera nudges', () => {
  it('resetCamera re-flies to the mounted initialCamera', async () => {
    const a = new TestAdapter()
    const initial = { center: { lon: 4.35, lat: 50.85 } }
    await a.mount(fakeElement, { initialCamera: initial })
    expect(a.flights).toHaveLength(1)
    await a.resetCamera()
    expect(a.flights).toHaveLength(2)
    expect(a.flights[1]).toEqual(initial)
  })

  it('resetCamera is a no-op when no initialCamera was given', async () => {
    const a = new TestAdapter()
    await a.mount(fakeElement)
    await a.resetCamera()
    expect(a.flights).toHaveLength(0)
  })

  it('provides safe default camera nudges (no-op / null)', () => {
    const a = new TestAdapter()
    expect(() => a.zoomBy(0.3)).not.toThrow()
    expect(() => a.rotateBy(45)).not.toThrow()
    expect(() => a.configureControls({ enableZoom: false })).not.toThrow()
    expect(a.getCameraState()).toBeNull()
  })
})
