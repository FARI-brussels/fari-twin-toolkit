import type { Feature, FeatureCollection, Place, Timeseries } from '@fari-brussels/twin-types'

export interface JoinIndicatorOptions {
  /**
   * Period (e.g. "2024") to pick from each Timeseries. If omitted, the latest
   * point is used.
   */
  period?: string
  /** Property name to write the joined value under on each feature. Default `value`. */
  property?: string
  /**
   * If true (default), places without geometry are skipped — viewers can't draw
   * them. Set false to include them with `geometry: null`.
   */
  requireGeometry?: boolean
}

/**
 * Join each Place's geometry with the value of an indicator at a given period,
 * producing a FeatureCollection ready to feed `viewer-core`'s `colorBy`
 * (`properties.{property}` is what the ramp keys off).
 *
 * Places with no matching series — or whose series has no point at the
 * requested period — get `null` so the renderer can show them as missing.
 */
export function joinIndicatorValues(
  places: Place[],
  series: Timeseries[],
  options: JoinIndicatorOptions = {},
): FeatureCollection {
  const property = options.property ?? 'value'
  const requireGeometry = options.requireGeometry ?? true

  const byPlace = new Map<string, number | null>()
  for (const ts of series) {
    if (ts.points.length === 0) continue
    const point = options.period
      ? ts.points.find((p) => p.period === options.period)
      : ts.points[ts.points.length - 1]
    if (point) byPlace.set(ts.place_id, point.value ?? null)
  }

  const features: Feature[] = []
  for (const place of places) {
    if (requireGeometry && !place.geometry) continue
    features.push({
      type: 'Feature',
      id: place.id,
      geometry: place.geometry ?? null,
      properties: {
        name: place.name,
        code: place.code ?? null,
        [property]: byPlace.get(place.id) ?? null,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
