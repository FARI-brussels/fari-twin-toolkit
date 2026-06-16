import { describe, it, expect } from 'vitest'
import { pointInPolygon, pointInGeometry, bbox, centroid } from '../src/geometry'
import type { Polygon } from '@fari-brussels/twin-types'

const square: Polygon = {
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
}

const squareWithHole: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
      [0, 0],
    ],
    [
      [3, 3],
      [3, 7],
      [7, 7],
      [7, 3],
      [3, 3],
    ],
  ],
}

describe('pointInPolygon', () => {
  it('detects points inside', () => {
    expect(pointInPolygon([1, 1], square.coordinates)).toBe(true)
    expect(pointInPolygon([5, 5], square.coordinates)).toBe(true)
  })
  it('detects points outside', () => {
    expect(pointInPolygon([11, 11], square.coordinates)).toBe(false)
    expect(pointInPolygon([-1, 5], square.coordinates)).toBe(false)
  })
  it('treats holes as outside', () => {
    expect(pointInPolygon([5, 5], squareWithHole.coordinates)).toBe(false)
    expect(pointInPolygon([1, 1], squareWithHole.coordinates)).toBe(true)
  })
})

describe('pointInGeometry', () => {
  it('returns false for non-polygonal geometries', () => {
    expect(pointInGeometry([0, 0], { type: 'Point', coordinates: [0, 0] })).toBe(false)
  })
})

describe('bbox', () => {
  it('computes the envelope', () => {
    expect(bbox(square)).toEqual([0, 0, 10, 10])
  })
})

describe('centroid', () => {
  it('returns the center of a square', () => {
    const [x, y] = centroid(square)
    expect(x).toBeCloseTo(5, 6)
    expect(y).toBeCloseTo(5, 6)
  })
})
