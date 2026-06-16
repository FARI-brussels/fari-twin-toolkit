import type { Feature, FeatureCollection, Place, PlaceKind } from '@fari-brussels/twin-types'
import { bbox, centroid } from './geometry'

export interface FeaturesToPlacesOptions {
  /** PlaceKind to assign to every produced Place. */
  kind: PlaceKind
  /** Feature property used as the Place id (falls back to feature.id). */
  idProp: string
  /** Feature property used as the Place name. */
  nameProp: string
  /** Feature property used as the Place code (NIS/LAU/INS, ...). */
  codeProp?: string
  /** Parent place id to set on every produced Place. */
  parentId?: string
  /** Compute and attach a bbox from the geometry. */
  computeBbox?: boolean
  /** Compute and attach a centroid Point from the geometry. */
  computeCentroid?: boolean
}

/** Map one GeoJSON Feature to a toolkit Place. */
export function featureToPlace(feature: Feature, opts: FeaturesToPlacesOptions): Place {
  const props = feature.properties ?? {}
  const idValue = props[opts.idProp] ?? feature.id
  const place: Place = {
    id: String(idValue ?? ''),
    name: String(props[opts.nameProp] ?? ''),
    kind: opts.kind,
    properties: props,
  }
  if (opts.codeProp) {
    const code = props[opts.codeProp]
    place.code = code == null ? null : String(code)
  }
  if (opts.parentId) place.parent_id = opts.parentId
  if (feature.geometry) {
    place.geometry = feature.geometry
    if (opts.computeBbox) place.bbox = bbox(feature.geometry)
    if (opts.computeCentroid) {
      place.centroid = { type: 'Point', coordinates: centroid(feature.geometry) }
    }
  }
  return place
}

/** Map every Feature in a collection to a Place. */
export function featuresToPlaces(fc: FeatureCollection, opts: FeaturesToPlacesOptions): Place[] {
  return fc.features.map((f) => featureToPlace(f, opts))
}
