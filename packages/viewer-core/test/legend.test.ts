import { describe, it, expect } from 'vitest'
import {
  DEFAULT_GRADIENT,
  sampleGradient,
  valueColor,
  rampFromRange,
  gradientLegend,
} from '../src/legend'
import { colorRampAt } from '../src/style'

describe('sampleGradient', () => {
  it('returns the endpoints at t=0 and t=1', () => {
    expect(sampleGradient(DEFAULT_GRADIENT, 0)).toBe('#00c800')
    expect(sampleGradient(DEFAULT_GRADIENT, 1)).toBe('#ff0000')
  })

  it('clamps out-of-range t', () => {
    expect(sampleGradient(DEFAULT_GRADIENT, -5)).toBe('#00c800')
    expect(sampleGradient(DEFAULT_GRADIENT, 5)).toBe('#ff0000')
  })

  it('blends between adjacent stops', () => {
    // Halfway across a 4-color palette lands between yellow and orange.
    const mid = sampleGradient(['#000000', '#ffffff'], 0.5)
    expect(mid).toBe('#808080')
  })

  it('handles a single-color palette', () => {
    expect(sampleGradient(['#123456'], 0.7)).toBe('#123456')
  })
})

describe('valueColor', () => {
  it('maps a value within range onto the gradient', () => {
    expect(valueColor(0, 0, 100)).toBe('#00c800')
    expect(valueColor(100, 0, 100)).toBe('#ff0000')
  })

  it('avoids divide-by-zero on a zero span', () => {
    expect(valueColor(5, 5, 5)).toBe('#00c800')
  })
})

describe('rampFromRange', () => {
  it('spreads the palette evenly across [min,max] and drives colorBy', () => {
    const ramp = rampFromRange('pm25', 0, 30)
    expect(ramp.property).toBe('pm25')
    expect(ramp.stops).toHaveLength(DEFAULT_GRADIENT.length)
    expect(ramp.stops[0]).toEqual({ value: 0, color: '#00c800' })
    expect(ramp.stops[ramp.stops.length - 1]).toEqual({ value: 30, color: '#ff0000' })
    // Resolves through the existing ramp machinery.
    expect(colorRampAt(ramp, 0)).toBe('#00c800')
    expect(colorRampAt(ramp, 30)).toBe('#ff0000')
  })
})

describe('gradientLegend', () => {
  it('builds equal-width banded labels with ≤ / range / > forms', () => {
    const legend = gradientLegend(0, 500, { steps: 4, title: 'Traffic', unit: '' })
    expect(legend.title).toBe('Traffic')
    expect(legend.items).toHaveLength(4)
    expect(legend.items.map((i) => i.label)).toEqual(['≤ 125', '125 - 250', '250 - 375', '> 375'])
    expect(legend.items[0]?.color).toBe('#00c800')
    expect(legend.items[3]?.color).toBe('#ff0000')
  })

  it('appends a unit and clamps steps to >= 2', () => {
    const legend = gradientLegend(0, 55, { steps: 1, unit: ' µg/m³' })
    expect(legend.items).toHaveLength(2)
    expect(legend.items[0]?.label).toContain('µg/m³')
  })
})
