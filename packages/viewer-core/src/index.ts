export * from './style'
export * from './legend'
export * from './layer-spec'
export * from './adapter'
export * from './errors'
export * from './emitter'
export * from './capabilities'
export * from './base-adapter'
export * from './from-twin-types'

// Convenience re-export of the GeoJSON types consumers need to build LayerSpecs.
export type { Feature, FeatureCollection } from '@fari-brussels/twin-types'
