import type { Feature, FeatureCollection, Position } from '@fari-brussels/twin-types'
import { pointInGeometry } from './geometry'

/** First feature whose (polygonal) geometry contains the point, if any. */
export function findContainingFeature(point: Position, fc: FeatureCollection): Feature | undefined {
  return fc.features.find((f) => (f.geometry ? pointInGeometry(point, f.geometry) : false))
}

/**
 * Resolve which area a point belongs to and return that area's code property.
 * Used to tag buildings/permits/etc. with the commune/district they fall in.
 */
export function assignCode(
  point: Position,
  areas: FeatureCollection,
  codeProp: string,
): string | undefined {
  const feature = findContainingFeature(point, areas)
  if (!feature) return undefined
  const value = (feature.properties ?? {})[codeProp]
  return value == null ? undefined : String(value)
}
