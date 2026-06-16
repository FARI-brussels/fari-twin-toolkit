/**
 * Fetch a source's static GeoJSON and normalise it: copy the source-specific
 * value (`no2`, `value`, …) onto a uniform `value` property, drop missing/invalid
 * readings, and record count + range. The result is `markRaw`'d so Vue's deep
 * watchers (in `useLayers`) don't traverse thousands of point features on every
 * tick — they just see a new collection identity when the source changes.
 */
import { markRaw } from 'vue'
import type { Feature, FeatureCollection } from '@fari-brussels/twin-types'
import type { AirSource } from './sources'

export interface LoadedSource {
  collection: FeatureCollection
  count: number
  min: number
  max: number
}

const cache = new Map<string, Promise<LoadedSource>>()

export function loadSource(source: AirSource): Promise<LoadedSource> {
  let pending = cache.get(source.id)
  if (!pending) {
    pending = fetchAndNormalize(source)
    cache.set(source.id, pending)
  }
  return pending
}

async function fetchAndNormalize(source: AirSource): Promise<LoadedSource> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${source.file}`)
  if (!res.ok) throw new Error(`Failed to load ${source.file}: ${res.status}`)
  const raw = (await res.json()) as FeatureCollection

  let min = Infinity
  let max = -Infinity
  const features: Feature[] = []
  for (const f of raw.features ?? []) {
    const value = Number((f.properties ?? {})[source.valueProp])
    if (!Number.isFinite(value) || value < source.minValid) continue
    if (value < min) min = value
    if (value > max) max = value
    features.push({
      type: 'Feature',
      geometry: f.geometry,
      properties: { ...f.properties, value },
    })
  }

  const collection: FeatureCollection = { type: 'FeatureCollection', features }
  return {
    collection: markRaw(collection),
    count: features.length,
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max,
  }
}
