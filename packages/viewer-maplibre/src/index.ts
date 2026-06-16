import type { AdapterDescriptor } from '@fari-brussels/viewer-core'
import { MapLibreAdapter } from './maplibre-adapter'

export * from './maplibre-adapter'
export * from './paint'

/** Descriptor for `selectAdapter`. The lightweight 2D renderer. */
export const maplibreDescriptor: AdapterDescriptor = {
  name: 'maplibre',
  capabilities: new Set(['geojson', 'wms', 'realtime']),
  create: () => new MapLibreAdapter(),
}
