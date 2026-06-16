import type { Geometry, Position } from '@fari-brussels/twin-types'

/** Ray-casting test: is a point inside a single linear ring? */
export function pointInRing(point: Position, ring: Position[]): boolean {
  const x = point[0] as number
  const y = point[1] as number
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i] as Position
    const pj = ring[j] as Position
    const xi = pi[0] as number
    const yi = pi[1] as number
    const xj = pj[0] as number
    const yj = pj[1] as number
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** Is a point inside a polygon (outer ring minus holes)? */
export function pointInPolygon(point: Position, polygon: Position[][]): boolean {
  const outer = polygon[0]
  if (!outer || !pointInRing(point, outer)) return false
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(point, polygon[i] as Position[])) return false // inside a hole
  }
  return true
}

/** Is a point inside a Polygon or MultiPolygon geometry? Other types -> false. */
export function pointInGeometry(point: Position, geom: Geometry): boolean {
  if (geom.type === 'Polygon') return pointInPolygon(point, geom.coordinates)
  if (geom.type === 'MultiPolygon') return geom.coordinates.some((p) => pointInPolygon(point, p))
  return false
}

function walkPositions(geom: Geometry, fn: (p: Position) => void): void {
  switch (geom.type) {
    case 'Point':
      fn(geom.coordinates)
      break
    case 'MultiPoint':
    case 'LineString':
      geom.coordinates.forEach(fn)
      break
    case 'MultiLineString':
    case 'Polygon':
      geom.coordinates.forEach((ring) => ring.forEach(fn))
      break
    case 'MultiPolygon':
      geom.coordinates.forEach((poly) => poly.forEach((ring) => ring.forEach(fn)))
      break
    case 'GeometryCollection':
      geom.geometries.forEach((g) => walkPositions(g, fn))
      break
  }
}

/** Axis-aligned bounding box [minX, minY, maxX, maxY]. */
export function bbox(geom: Geometry): [number, number, number, number] {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  walkPositions(geom, (p) => {
    const x = p[0] as number
    const y = p[1] as number
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  })
  return [minX, minY, maxX, maxY]
}

function largestPolygon(geom: Geometry): Position[][] | undefined {
  if (geom.type === 'Polygon') return geom.coordinates
  if (geom.type === 'MultiPolygon') {
    let best: Position[][] | undefined
    let bestArea = -Infinity
    for (const poly of geom.coordinates) {
      const area = ringBboxArea(poly[0])
      if (area > bestArea) {
        bestArea = area
        best = poly
      }
    }
    return best
  }
  return undefined
}

function ringBboxArea(ring: Position[] | undefined): number {
  if (!ring || ring.length === 0) return 0
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of ring) {
    const x = p[0] as number
    const y = p[1] as number
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return (maxX - minX) * (maxY - minY)
}

/**
 * Centroid as a [x, y] position. Uses the area-weighted centroid of the largest
 * polygon ring; falls back to the bbox center for non-polygonal geometries.
 */
export function centroid(geom: Geometry): Position {
  const poly = largestPolygon(geom)
  const ring = poly?.[0]
  if (ring && ring.length >= 3) {
    let area = 0
    let cx = 0
    let cy = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const pi = ring[i] as Position
      const pj = ring[j] as Position
      const xi = pi[0] as number
      const yi = pi[1] as number
      const xj = pj[0] as number
      const yj = pj[1] as number
      const f = xi * yj - xj * yi
      area += f
      cx += (xi + xj) * f
      cy += (yi + yj) * f
    }
    if (area !== 0) {
      area *= 0.5
      return [cx / (6 * area), cy / (6 * area)]
    }
  }
  const [minX, minY, maxX, maxY] = bbox(geom)
  return [(minX + maxX) / 2, (minY + maxY) / 2]
}
