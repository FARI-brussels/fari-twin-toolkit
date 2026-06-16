import { describe, it, expect } from 'vitest'
import { joinIndicatorValues } from '../src/join'
import type { Place, Timeseries } from '@fari-brussels/twin-types'

const squareGeom = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
  ],
}

const places: Place[] = [
  {
    id: 'A',
    name: 'Alpha',
    kind: 'municipality',
    code: '001',
    geometry: squareGeom,
    properties: {},
  },
  {
    id: 'B',
    name: 'Beta',
    kind: 'municipality',
    code: '002',
    geometry: squareGeom,
    properties: {},
  },
  // Place with no geometry — should be skipped by default
  { id: 'C', name: 'Gamma', kind: 'municipality', code: '003', properties: {} },
]

const series: Timeseries[] = [
  {
    place_id: 'A',
    indicator_key: 'unemployment_rate',
    points: [
      { period: '2022', value: 14.1 },
      { period: '2023', value: 13.8 },
      { period: '2024', value: 13.2 },
    ],
  },
  {
    place_id: 'B',
    indicator_key: 'unemployment_rate',
    points: [
      { period: '2022', value: 9 },
      { period: '2024', value: 8.5 },
    ],
  },
  // No series for C
]

describe('joinIndicatorValues', () => {
  it('uses the latest point when period is omitted', () => {
    const fc = joinIndicatorValues(places, series)
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features).toHaveLength(2) // C skipped (no geometry)
    const a = fc.features[0]!
    const b = fc.features[1]!
    expect(a.properties?.value).toBe(13.2)
    expect(b.properties?.value).toBe(8.5)
    expect(a.properties?.name).toBe('Alpha')
    expect(a.properties?.code).toBe('001')
  })

  it('picks the value at a specific period', () => {
    const fc = joinIndicatorValues(places, series, { period: '2022' })
    expect(fc.features[0]!.properties?.value).toBe(14.1)
    expect(fc.features[1]!.properties?.value).toBe(9)
  })

  it('writes null when a place has no matching point', () => {
    const fc = joinIndicatorValues(places, series, { period: '2023' })
    expect(fc.features[0]!.properties?.value).toBe(13.8)
    expect(fc.features[1]!.properties?.value).toBe(null) // B has no 2023 point
  })

  it('respects a custom property name', () => {
    const fc = joinIndicatorValues(places, series, { property: 'unemployment' })
    expect(fc.features[0]!.properties).toMatchObject({ unemployment: 13.2 })
    expect(fc.features[0]!.properties?.value).toBeUndefined()
  })

  it('includes geometry-less places when requireGeometry is false', () => {
    const fc = joinIndicatorValues(places, series, { requireGeometry: false })
    expect(fc.features).toHaveLength(3)
    const c = fc.features[2]!
    expect(c.geometry).toBeNull()
    expect(c.properties?.value).toBe(null)
  })
})
