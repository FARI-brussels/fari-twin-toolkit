import { describe, it, expect } from 'vitest'
import { panelFromTimeseries } from '../src/dataset'
import { predictIndicator } from '../src/predict'
import type { Timeseries } from '@fari-brussels/twin-types'

// 5 places, linear relationship y = 2x + 1 across the panel at period 2024.
function buildLinearPanel(): Timeseries[] {
  const places = ['A', 'B', 'C', 'D', 'E']
  const out: Timeseries[] = []
  for (let i = 0; i < places.length; i++) {
    const x = i * 2 // 0, 2, 4, 6, 8
    out.push({
      place_id: places[i]!,
      indicator_key: 'x',
      points: [{ period: '2024', value: x }],
    })
    out.push({
      place_id: places[i]!,
      indicator_key: 'y',
      points: [{ period: '2024', value: 2 * x + 1 }],
    })
  }
  return out
}

describe('predictIndicator (linear)', () => {
  const dataset = panelFromTimeseries(buildLinearPanel())

  it('baseline matches the observed y and delta is zero with no override', () => {
    const result = predictIndicator({
      dataset,
      driverKey: 'x',
      outcomeKey: 'y',
      placeId: 'C',
      model: 'linear',
    })
    expect(result.baseline).toBe(9) // 2*4 + 1
    expect(result.predicted).toBeCloseTo(9, 9)
    expect(result.delta).toBeCloseTo(0, 9)
    expect(result.r2).toBeCloseTo(1, 9)
  })

  it('applies an override and reports the predicted delta', () => {
    // Increase C's x from 4 to 10 -> y should rise by 2 * 6 = 12
    const result = predictIndicator({
      dataset,
      driverKey: 'x',
      outcomeKey: 'y',
      placeId: 'C',
      model: 'linear',
      overrides: [{ place_id: 'C', indicator_key: 'x', value: 10 }],
    })
    expect(result.predicted).toBeCloseTo(21, 9)
    expect(result.delta).toBeCloseTo(12, 9)
  })

  it('returns null prediction when the driver is unknown for the place', () => {
    const result = predictIndicator({
      dataset,
      driverKey: 'x',
      outcomeKey: 'y',
      placeId: 'Z', // not present
      model: 'linear',
    })
    expect(result.baseline).toBeNull()
    expect(result.predicted).toBeNull()
  })
})

describe('predictIndicator (polynomial2)', () => {
  it('captures a non-linear relationship the linear model would miss', () => {
    // y = x^2 at period 2024 across 6 places
    const series: Timeseries[] = []
    const xs = [-3, -2, -1, 0, 1, 2, 3]
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i]!
      series.push({
        place_id: `P${i}`,
        indicator_key: 'x',
        points: [{ period: '2024', value: x }],
      })
      series.push({
        place_id: `P${i}`,
        indicator_key: 'y',
        points: [{ period: '2024', value: x * x }],
      })
    }
    const dataset = panelFromTimeseries(series)
    const out = predictIndicator({
      dataset,
      driverKey: 'x',
      outcomeKey: 'y',
      placeId: 'P3', // x = 0
      model: 'polynomial2',
      overrides: [{ place_id: 'P3', indicator_key: 'x', value: 4 }],
    })
    expect(out.predicted).toBeCloseTo(16, 4)
    expect(out.r2).toBeCloseTo(1, 4)
  })
})
