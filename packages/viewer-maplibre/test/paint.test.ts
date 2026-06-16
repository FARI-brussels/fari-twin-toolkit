import { describe, it, expect } from 'vitest'
import type { ColorRamp } from '@fari-brussels/viewer-core'
import { circlePaint, colorByExpression, fillPaint, linePaint } from '../src/paint'

describe('colorByExpression', () => {
  it('builds an interpolate expression by default', () => {
    const ramp: ColorRamp = {
      property: 'no2',
      stops: [
        { value: 0, color: '#000000' },
        { value: 10, color: '#ffffff' },
      ],
    }
    expect(colorByExpression(ramp)).toEqual([
      'interpolate',
      ['linear'],
      ['to-number', ['get', 'no2'], 0],
      0,
      '#000000',
      10,
      '#ffffff',
    ])
  })

  it('builds a step expression in step mode', () => {
    const ramp: ColorRamp = {
      property: 'no2',
      mode: 'step',
      stops: [
        { value: 0, color: '#00ff00' },
        { value: 40, color: '#ff0000' },
      ],
    }
    expect(colorByExpression(ramp)).toEqual([
      'step',
      ['to-number', ['get', 'no2'], 0],
      '#00ff00',
      40,
      '#ff0000',
    ])
  })

  it('sorts unsorted stops before building the expression', () => {
    const ramp: ColorRamp = {
      property: 'v',
      mode: 'step',
      stops: [
        { value: 40, color: '#ff0000' },
        { value: 0, color: '#00ff00' },
        { value: 20, color: '#ffbb00' },
      ],
    }
    expect(colorByExpression(ramp)).toEqual([
      'step',
      ['to-number', ['get', 'v'], 0],
      '#00ff00',
      20,
      '#ffbb00',
      40,
      '#ff0000',
    ])
  })

  it('returns a constant colour for a single stop', () => {
    expect(colorByExpression({ property: 'v', stops: [{ value: 0, color: '#123456' }] })).toBe(
      '#123456',
    )
  })

  it('throws on an empty ramp', () => {
    expect(() => colorByExpression({ property: 'v', stops: [] })).toThrow()
  })
})

describe('paint builders', () => {
  it('circlePaint uses a colorBy expression when present', () => {
    const paint = circlePaint({
      colorBy: {
        property: 'no2',
        mode: 'step',
        stops: [
          { value: 0, color: '#00ff00' },
          { value: 40, color: '#ff0000' },
        ],
      },
      pointRadius: 6,
    })
    expect(paint['circle-color']).toEqual([
      'step',
      ['to-number', ['get', 'no2'], 0],
      '#00ff00',
      40,
      '#ff0000',
    ])
    expect(paint['circle-radius']).toBe(6)
  })

  it('circlePaint falls back to pointColor then fillColor', () => {
    expect(circlePaint({ pointColor: '#abcdef' })['circle-color']).toBe('#abcdef')
    expect(circlePaint({ fillColor: '#fedcba' })['circle-color']).toBe('#fedcba')
  })

  it('fillPaint maps fillColor and opacity', () => {
    const paint = fillPaint({ fillColor: '#64D8BF', fillOpacity: 0.5 })
    expect(paint['fill-color']).toBe('#64D8BF')
    expect(paint['fill-opacity']).toBe(0.5)
  })

  it('linePaint maps strokeColor and width', () => {
    const paint = linePaint({ strokeColor: '#183E91', strokeWidth: 2 })
    expect(paint['line-color']).toBe('#183E91')
    expect(paint['line-width']).toBe(2)
  })
})
