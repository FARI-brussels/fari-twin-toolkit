import { open } from 'shapefile'
import type { Feature, FeatureCollection } from '@fari-brussels/twin-types'
import { reprojectFeatureCollection } from './reproject'

export interface ReadShapefileOptions {
  /** Path to the sidecar .dbf (attributes). Defaults to the .shp's sibling. */
  dbf?: string
  /** Source CRS of the .shp; if set with `to`, the result is reprojected. */
  from?: string
  /** Target CRS; reprojects when both `from` and `to` are provided. */
  to?: string
}

/**
 * Read an ESRI Shapefile into a GeoJSON FeatureCollection. Shapefiles carry no
 * CRS in the geometry, so pass `from`/`to` to reproject (e.g. Lambert72 ->
 * WGS84). The matching .dbf/.prj must sit next to the .shp.
 */
export async function readShapefile(
  shp: string,
  opts: ReadShapefileOptions = {},
): Promise<FeatureCollection> {
  const source = await open(shp, opts.dbf)
  const features: Feature[] = []
  let result = await source.read()
  while (!result.done) {
    features.push(result.value as unknown as Feature)
    result = await source.read()
  }
  const fc: FeatureCollection = { type: 'FeatureCollection', features }
  if (opts.from && opts.to) return reprojectFeatureCollection(fc, opts.from, opts.to)
  return fc
}
