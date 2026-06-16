import proj4 from 'proj4'
import type { Geometry, Position, Feature, FeatureCollection } from '@fari-brussels/twin-types'

/** Common coordinate reference systems used in Brussels / Belgium / EU work. */
export const CRS = {
  /** WGS84 lon/lat — the GeoJSON default. */
  WGS84: 'EPSG:4326',
  /** Web Mercator — slippy-map tiles. */
  WEB_MERCATOR: 'EPSG:3857',
  /** Belgian Lambert 72 — Belgian national grid (UrbIS, cadastre). */
  LAMBERT72: 'EPSG:31370',
  /** ETRS89-LAEA Europe — pan-European statistical grid (Eurostat, IBSA). */
  ETRS89_LAEA: 'EPSG:3035',
} as const

// proj4 ships EPSG:4326 and EPSG:3857; the rest need explicit definitions.
const DEFS: Record<string, string> = {
  'EPSG:31370':
    '+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 ' +
    '+lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl ' +
    '+towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs',
  'EPSG:3035':
    '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 ' +
    '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
}

let registered = false
function ensureDefs(): void {
  if (registered) return
  for (const [code, def] of Object.entries(DEFS)) {
    if (!proj4.defs(code)) proj4.defs(code, def)
  }
  registered = true
}

/** Register an additional CRS definition (proj4 string) under an EPSG code. */
export function registerCrs(code: string, def: string): void {
  proj4.defs(code, def)
}

/** Reproject a single [x, y] (or [x, y, z]) position. z is passed through. */
export function reprojectPosition(pos: Position, from: string, to: string): Position {
  ensureDefs()
  if (pos.length < 2) throw new Error('Position needs at least [x, y]')
  const x = pos[0] as number
  const y = pos[1] as number
  const out = proj4(from, to, [x, y]) as [number, number]
  const z = pos[2]
  return z === undefined ? [out[0], out[1]] : [out[0], out[1], z]
}

/** Reproject any GeoJSON geometry, recursing into collections. */
export function reprojectGeometry(geom: Geometry, from: string, to: string): Geometry {
  switch (geom.type) {
    case 'Point':
      return { ...geom, coordinates: reprojectPosition(geom.coordinates, from, to) }
    case 'MultiPoint':
    case 'LineString':
      return { ...geom, coordinates: geom.coordinates.map((c) => reprojectPosition(c, from, to)) }
    case 'MultiLineString':
    case 'Polygon':
      return {
        ...geom,
        coordinates: geom.coordinates.map((ring) =>
          ring.map((c) => reprojectPosition(c, from, to)),
        ),
      }
    case 'MultiPolygon':
      return {
        ...geom,
        coordinates: geom.coordinates.map((poly) =>
          poly.map((ring) => ring.map((c) => reprojectPosition(c, from, to))),
        ),
      }
    case 'GeometryCollection':
      return {
        ...geom,
        geometries: geom.geometries.map((g) => reprojectGeometry(g, from, to)),
      }
  }
}

/** Reproject a Feature's geometry (null geometry is left untouched). */
export function reprojectFeature(feature: Feature, from: string, to: string): Feature {
  if (!feature.geometry) return feature
  return { ...feature, geometry: reprojectGeometry(feature.geometry, from, to) }
}

/** Reproject every feature in a FeatureCollection. */
export function reprojectFeatureCollection(
  fc: FeatureCollection,
  from: string,
  to: string,
): FeatureCollection {
  return { ...fc, features: fc.features.map((f) => reprojectFeature(f, from, to)) }
}
