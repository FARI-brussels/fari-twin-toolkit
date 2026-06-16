import { describe, it, expect } from 'vitest'
import { applyOverrides, latestPeriod, pairs, panelFromTimeseries, valueOf } from '../src/dataset'
import type { ScenarioOverride, Timeseries } from '@fari-brussels/twin-types'

const series: Timeseries[] = [
  {
    place_id: 'A',
    indicator_key: 'x',
    points: [
      { period: '2022', value: 1 },
      { period: '2024', value: 5 },
    ],
  },
  {
    place_id: 'A',
    indicator_key: 'y',
    points: [
      { period: '2022', value: 3 },
      { period: '2024', value: 11 },
    ],
  },
  {
    place_id: 'B',
    indicator_key: 'x',
    points: [
      { period: '2022', value: 2 },
      { period: '2024', value: 6 },
    ],
  },
  {
    place_id: 'B',
    indicator_key: 'y',
    points: [
      { period: '2022', value: 5 },
      { period: '2024', value: 13 },
    ],
  },
]

const ds = panelFromTimeseries(series)

describe('PanelDataset helpers', () => {
  it('flattens timeseries into observations', () => {
    expect(ds.values).toHaveLength(8)
  })

  it('latestPeriod is the lexicographically last period', () => {
    expect(latestPeriod(ds)).toBe('2024')
  })

  it('valueOf reads a single observation, defaulting to the latest period', () => {
    expect(valueOf(ds, 'A', 'y')).toBe(11)
    expect(valueOf(ds, 'A', 'y', '2022')).toBe(3)
    expect(valueOf(ds, 'C', 'y')).toBeUndefined()
  })

  it('pairs extracts (x, y) per place at the chosen period', () => {
    expect(pairs(ds, 'x', 'y')).toEqual([
      { x: 5, y: 11 },
      { x: 6, y: 13 },
    ])
    expect(pairs(ds, 'x', 'y', '2022')).toEqual([
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ])
  })

  it('applyOverrides returns a new dataset with the overridden values', () => {
    const overrides: ScenarioOverride[] = [{ place_id: 'A', indicator_key: 'x', value: 99 }]
    const next = applyOverrides(ds, overrides)
    expect(valueOf(next, 'A', 'x')).toBe(99)
    // unchanged
    expect(valueOf(ds, 'A', 'x')).toBe(5)
    expect(valueOf(next, 'B', 'x')).toBe(6)
    // earlier periods untouched
    expect(valueOf(next, 'A', 'x', '2022')).toBe(1)
  })

  it('applyOverrides is a no-op when there are none', () => {
    expect(applyOverrides(ds, [])).toBe(ds)
  })
})
