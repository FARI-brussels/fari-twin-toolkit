import { describe, it, expect } from 'vitest'
import { featuresToPlaces } from '../src/places'
import type { FeatureCollection } from '@fari-brussels/twin-types'

const fc: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { ID: 'x1', NAME: 'Bruxelles', NIS: '21004' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 2],
            [2, 2],
            [2, 0],
            [0, 0],
          ],
        ],
      },
    },
  ],
}

describe('featuresToPlaces', () => {
  it('maps feature properties to a Place', () => {
    const [place] = featuresToPlaces(fc, {
      kind: 'municipality',
      idProp: 'ID',
      nameProp: 'NAME',
      codeProp: 'NIS',
      computeBbox: true,
      computeCentroid: true,
    })
    expect(place?.id).toBe('x1')
    expect(place?.name).toBe('Bruxelles')
    expect(place?.code).toBe('21004')
    expect(place?.kind).toBe('municipality')
    expect(place?.bbox).toEqual([0, 0, 2, 2])
    expect(place?.centroid?.coordinates[0]).toBeCloseTo(1, 6)
    expect(place?.centroid?.coordinates[1]).toBeCloseTo(1, 6)
  })
})
