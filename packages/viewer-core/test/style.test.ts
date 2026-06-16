import { describe, it, expect } from 'vitest'
import {
  parseHexColor,
  rgbToHex,
  interpolateColorRamp,
  stepColorRamp,
  resolveFeatureColor,
  type ColorStop,
} from '../src/style'

describe('hex helpers', () => {
  it('parses #rrggbb and #rgb', () => {
    expect(parseHexColor('#ff0000')).toEqual([255, 0, 0])
    expect(parseHexColor('#fff')).toEqual([255, 255, 255])
  })
  it('round-trips rgbToHex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
  })
  it('rejects bad input', () => {
    expect(() => parseHexColor('#zz')).toThrow()
  })
})

describe('interpolateColorRamp', () => {
  const ramp: ColorStop[] = [
    { value: 0, color: '#000000' },
    { value: 10, color: '#ffffff' },
  ]
  it('interpolates the midpoint', () => {
    expect(interpolateColorRamp(ramp, 5)).toBe('#808080')
  })
  it('clamps below and above the range', () => {
    expect(interpolateColorRamp(ramp, -3)).toBe('#000000')
    expect(interpolateColorRamp(ramp, 99)).toBe('#ffffff')
  })
  it('sorts unsorted stops', () => {
    const unsorted: ColorStop[] = [
      { value: 10, color: '#ffffff' },
      { value: 0, color: '#000000' },
    ]
    expect(interpolateColorRamp(unsorted, 5)).toBe('#808080')
  })
})

describe('stepColorRamp', () => {
  // A norm threshold: green within the limit, red at/above it.
  const norm: ColorStop[] = [
    { value: 0, color: '#00ff00' },
    { value: 40, color: '#ff0000' },
  ]
  it('holds each stop colour until the next stop (no blending)', () => {
    expect(stepColorRamp(norm, 0)).toBe('#00ff00')
    expect(stepColorRamp(norm, 39.9)).toBe('#00ff00')
    expect(stepColorRamp(norm, 40)).toBe('#ff0000')
    expect(stepColorRamp(norm, 80)).toBe('#ff0000')
  })
  it('clamps below the first stop', () => {
    expect(stepColorRamp(norm, -5)).toBe('#00ff00')
  })
  it('picks the right band with multiple stops regardless of order', () => {
    const buckets: ColorStop[] = [
      { value: 20, color: '#ffbb00' },
      { value: 0, color: '#00ff00' },
      { value: 10, color: '#ffff00' },
    ]
    expect(stepColorRamp(buckets, 5)).toBe('#00ff00')
    expect(stepColorRamp(buckets, 12)).toBe('#ffff00')
    expect(stepColorRamp(buckets, 25)).toBe('#ffbb00')
  })
})

describe('resolveFeatureColor', () => {
  it('uses step mode when the ramp asks for it', () => {
    const color = resolveFeatureColor(
      {
        colorBy: {
          property: 'v',
          mode: 'step',
          stops: [
            { value: 0, color: '#00ff00' },
            { value: 40, color: '#ff0000' },
          ],
        },
      },
      { v: 35 },
    )
    expect(color).toBe('#00ff00') // 35 < 40 → still within the limit
  })

  it('uses colorBy when the property is numeric', () => {
    const color = resolveFeatureColor(
      {
        colorBy: {
          property: 'v',
          stops: [
            { value: 0, color: '#000000' },
            { value: 10, color: '#ffffff' },
          ],
        },
      },
      { v: 5 },
    )
    expect(color).toBe('#808080')
  })
  it('falls back to fillColor when colorBy is absent or non-numeric', () => {
    expect(resolveFeatureColor({ fillColor: '#123456' }, { v: 'x' })).toBe('#123456')
    expect(
      resolveFeatureColor(
        { fillColor: '#123456', colorBy: { property: 'v', stops: [{ value: 0, color: '#000' }] } },
        { v: 'not-a-number' },
      ),
    ).toBe('#123456')
  })
})
