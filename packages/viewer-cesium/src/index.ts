import type { AdapterDescriptor } from '@fari-brussels/viewer-core'
import { CesiumAdapter } from './cesium-adapter'

export * from './cesium-adapter'

/** Descriptor for `selectAdapter`. Cesium covers every layer kind. */
export const cesiumDescriptor: AdapterDescriptor = {
  name: 'cesium',
  capabilities: new Set(['geojson', 'wms', 'tileset3d', 'realtime', 'mesh3d', 'pointcloud']),
  create: () => new CesiumAdapter(),
}
