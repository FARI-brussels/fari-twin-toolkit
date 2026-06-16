/**
 * Load the Brussels region boundary and derive two layers from it:
 *
 * - `outline` — the region polygon, drawn as a crisp border (no fill).
 * - `mask` — a polygon covering a wide world rectangle with the region punched
 *   out as a hole, so filling it dims *everything outside* Brussels. This is the
 *   classic "spotlight" framing, built with a hole ring instead of a turf
 *   `difference` so the app needs no geometry library.
 *
 * Plus the region `bbox`, used to frame the camera.
 */
import { markRaw } from 'vue'
import type { FeatureCollection, Geometry, Position } from '@fari-brussels/twin-types'

/** A generous rectangle around Brussels; everything here minus the region is dimmed. */
const WORLD_RING: Position[] = [
  [-30, 30],
  [40, 30],
  [40, 65],
  [-30, 65],
  [-30, 30],
]

export interface Boundary {
  mask: FeatureCollection
  outline: FeatureCollection
  bbox: [number, number, number, number]
}

let pending: Promise<Boundary> | null = null

export function loadBoundary(): Promise<Boundary> {
  if (!pending) pending = fetchBoundary()
  return pending
}

async function fetchBoundary(): Promise<Boundary> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/brussels_boundary.geojson`)
  if (!res.ok) throw new Error(`Failed to load brussels_boundary.geojson: ${res.status}`)
  const fc = (await res.json()) as FeatureCollection
  const region = fc.features[0]
  if (!region?.geometry) throw new Error('boundary feature has no geometry')

  const rings = exteriorRings(region.geometry)
  const maskGeometry: Geometry = { type: 'Polygon', coordinates: [WORLD_RING, ...rings] }

  return {
    mask: markRaw(wrap(maskGeometry)),
    outline: markRaw(wrap(region.geometry)),
    bbox: bboxOf(rings),
  }
}

/** Exterior ring(s) of a (Multi)Polygon — the parts we punch out of the mask. */
function exteriorRings(geometry: Geometry): Position[][] {
  if (geometry.type === 'Polygon') return [geometry.coordinates[0] as Position[]]
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((poly) => poly[0] as Position[])
  }
  return []
}

function bboxOf(rings: Position[][]): [number, number, number, number] {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  for (const ring of rings) {
    for (const pos of ring) {
      const lon = pos[0]
      const lat = pos[1]
      if (lon == null || lat == null) continue
      if (lon < minLon) minLon = lon
      if (lat < minLat) minLat = lat
      if (lon > maxLon) maxLon = lon
      if (lat > maxLat) maxLat = lat
    }
  }
  return [minLon, minLat, maxLon, maxLat]
}

function wrap(geometry: Geometry): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry, properties: {} }],
  }
}
