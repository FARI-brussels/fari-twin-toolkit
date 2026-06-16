import { describe, it, expect } from 'vitest'
import { assignCode, findContainingFeature } from '../src/assign'
import type { FeatureCollection } from '@fari-brussels/twin-types'

const areas: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { nis: 'A' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 10],
            [10, 10],
            [10, 0],
            [0, 0],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { nis: 'B' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [10, 0],
            [10, 10],
            [20, 10],
            [20, 0],
            [10, 0],
          ],
        ],
      },
    },
  ],
}

describe('assignCode', () => {
  it('returns the code of the containing area', () => {
    expect(assignCode([5, 5], areas, 'nis')).toBe('A')
    expect(assignCode([15, 5], areas, 'nis')).toBe('B')
  })
  it('returns undefined when no area contains the point', () => {
    expect(assignCode([100, 100], areas, 'nis')).toBeUndefined()
  })
})

describe('findContainingFeature', () => {
  it('finds the right feature', () => {
    const f = findContainingFeature([5, 5], areas)
    expect((f?.properties ?? {}).nis).toBe('A')
  })
})
