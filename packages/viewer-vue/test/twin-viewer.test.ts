import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
  BaseAdapter,
  type BasemapSpec,
  type CameraTarget,
  type FlyOptions,
  type LayerKind,
  type LayerSpec,
  type PickResult,
  type ViewerOpts,
} from '@fari-brussels/viewer-core'
import { TwinViewer } from '../src/twin-viewer'

class MockAdapter extends BaseAdapter {
  readonly name = 'mock'
  readonly capabilities = new Set<LayerKind>([
    'geojson',
    'wms',
    'tileset3d',
    'realtime',
    'mesh3d',
    'pointcloud',
  ])
  added: string[] = []
  removed: string[] = []
  destroyed = false

  protected async onMount(_c: HTMLElement, _o: ViewerOpts): Promise<void> {}
  protected onDestroy(): void {
    this.destroyed = true
  }
  protected onAddLayer(spec: LayerSpec): void {
    this.added.push(spec.id)
  }
  protected onUpdateLayer(): void {}
  protected onRemoveLayer(spec: LayerSpec): void {
    this.removed.push(spec.id)
  }
  protected onSetBasemap(_s: BasemapSpec | null): void {}
  protected async onFlyTo(_t: CameraTarget, _o: FlyOptions): Promise<void> {}

  firePick(pick: PickResult): void {
    this.emitter.emit('click', pick)
  }
}

const geo = (id: string): LayerSpec => ({
  id,
  kind: 'geojson',
  data: { type: 'FeatureCollection', features: [] },
})

describe('<TwinViewer>', () => {
  it('mounts the adapter, emits ready, and adds initial layers', async () => {
    let instance: MockAdapter | undefined
    const wrapper = mount(TwinViewer, {
      props: {
        adapter: () => (instance = new MockAdapter()),
        layers: [geo('a')],
        basemap: { kind: 'osm' },
      },
    })
    await flushPromises()
    await nextTick()

    expect(wrapper.emitted('ready')).toBeTruthy()
    expect(instance?.added).toEqual(['a'])
  })

  it('reconciles layers when the prop changes', async () => {
    let instance: MockAdapter | undefined
    const wrapper = mount(TwinViewer, {
      props: { adapter: () => (instance = new MockAdapter()), layers: [geo('a')] },
    })
    await flushPromises()

    await wrapper.setProps({ layers: [geo('b')] })
    await flushPromises()

    expect(instance?.removed).toContain('a')
    expect(instance?.added).toContain('b')
  })

  it('forwards pick events', async () => {
    let instance: MockAdapter | undefined
    const wrapper = mount(TwinViewer, {
      props: { adapter: () => (instance = new MockAdapter()), layers: [] },
    })
    await flushPromises()

    instance?.firePick({ featureId: 'x', position: { lon: 4.35, lat: 50.85 } })
    expect(wrapper.emitted('pick')?.[0]?.[0]).toMatchObject({ featureId: 'x' })
  })

  it('destroys the adapter on unmount', async () => {
    let instance: MockAdapter | undefined
    const wrapper = mount(TwinViewer, {
      props: { adapter: () => (instance = new MockAdapter()), layers: [] },
    })
    await flushPromises()

    wrapper.unmount()
    expect(instance?.destroyed).toBe(true)
  })
})
