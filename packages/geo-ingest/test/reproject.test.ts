import { describe, it, expect } from 'vitest'
import { CRS, reprojectPosition, reprojectGeometry } from '../src/reproject'
import type { Polygon } from '@fari-brussels/twin-types'

const BRUSSELS_WGS84: [number, number] = [4.3517, 50.8503]

describe('reprojectPosition', () => {
  it('round-trips WGS84 <-> Lambert72 to sub-millimeter degrees', () => {
    const l72 = reprojectPosition(BRUSSELS_WGS84, CRS.WGS84, CRS.LAMBERT72)
    const back = reprojectPosition(l72, CRS.LAMBERT72, CRS.WGS84)
    expect(back[0] as number).toBeCloseTo(BRUSSELS_WGS84[0], 6)
    expect(back[1] as number).toBeCloseTo(BRUSSELS_WGS84[1], 6)
  })

  it('places Brussels inside the Lambert72 national grid envelope', () => {
    const [x, y] = reprojectPosition(BRUSSELS_WGS84, CRS.WGS84, CRS.LAMBERT72)
    expect(x as number).toBeGreaterThan(140000)
    expect(x as number).toBeLessThan(160000)
    expect(y as number).toBeGreaterThan(160000)
    expect(y as number).toBeLessThan(180000)
  })

  it('round-trips WGS84 <-> ETRS89-LAEA', () => {
    const laea = reprojectPosition(BRUSSELS_WGS84, CRS.WGS84, CRS.ETRS89_LAEA)
    const back = reprojectPosition(laea, CRS.ETRS89_LAEA, CRS.WGS84)
    expect(back[0] as number).toBeCloseTo(BRUSSELS_WGS84[0], 6)
    expect(back[1] as number).toBeCloseTo(BRUSSELS_WGS84[1], 6)
  })

  it('passes through a z coordinate', () => {
    const out = reprojectPosition([4.3517, 50.8503, 42], CRS.WGS84, CRS.LAMBERT72)
    expect(out).toHaveLength(3)
    expect(out[2]).toBe(42)
  })
})

describe('reprojectGeometry', () => {
  it('reprojects every ring of a polygon', () => {
    const poly: Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [4.35, 50.85],
          [4.36, 50.85],
          [4.36, 50.86],
          [4.35, 50.85],
        ],
      ],
    }
    const out = reprojectGeometry(poly, CRS.WGS84, CRS.LAMBERT72) as Polygon
    const ring = out.coordinates[0] as number[][]
    for (const c of ring) {
      expect(c[0] as number).toBeGreaterThan(100000)
      expect(c[1] as number).toBeGreaterThan(100000)
    }
  })
})
