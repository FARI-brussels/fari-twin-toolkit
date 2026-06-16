import type { IndicatorValue, ScenarioOverride, Timeseries } from '@fari-brussels/twin-types'
import type { Sample } from './types'

/**
 * Panel data: a flat list of (place_id, indicator_key, period, value)
 * observations. This is the universal shape the engine works against; you can
 * project a Timeseries[] into one with `panelFromTimeseries`.
 */
export interface PanelDataset {
  values: IndicatorValue[]
}

export function panelFromTimeseries(series: Timeseries[]): PanelDataset {
  const values: IndicatorValue[] = []
  for (const ts of series) {
    for (const p of ts.points) {
      values.push({
        place_id: ts.place_id,
        indicator_key: ts.indicator_key,
        period: p.period,
        value: p.value ?? null,
      })
    }
  }
  return { values }
}

/** Latest period present anywhere in the dataset (lexicographic; YYYY sorts correctly). */
export function latestPeriod(dataset: PanelDataset): string | undefined {
  let latest: string | undefined
  for (const v of dataset.values) {
    if (!latest || v.period > latest) latest = v.period
  }
  return latest
}

/** Read a single value (or undefined if absent). */
export function valueOf(
  dataset: PanelDataset,
  placeId: string,
  indicatorKey: string,
  period?: string,
): number | null | undefined {
  const target = period ?? latestPeriod(dataset)
  if (target === undefined) return undefined
  for (const v of dataset.values) {
    if (v.place_id === placeId && v.indicator_key === indicatorKey && v.period === target) {
      return v.value
    }
  }
  return undefined
}

/**
 * Extract (x, y) samples for fitting a regression — one per place that has
 * non-null values for both indicators at the given period.
 */
export function pairs(
  dataset: PanelDataset,
  xKey: string,
  yKey: string,
  period?: string,
): Sample[] {
  const target = period ?? latestPeriod(dataset)
  if (target === undefined) return []
  const xs = new Map<string, number>()
  const ys = new Map<string, number>()
  for (const v of dataset.values) {
    if (v.period !== target || v.value == null) continue
    if (v.indicator_key === xKey) xs.set(v.place_id, v.value)
    if (v.indicator_key === yKey) ys.set(v.place_id, v.value)
  }
  const out: Sample[] = []
  for (const [placeId, x] of xs) {
    const y = ys.get(placeId)
    if (y === undefined) continue
    out.push({ x, y })
  }
  return out
}

/**
 * Apply scenario overrides on top of the dataset, returning a new PanelDataset.
 * An override replaces the value at (place_id, indicator_key, period) — the
 * period defaults to the dataset's `latestPeriod` if not given.
 */
export function applyOverrides(
  dataset: PanelDataset,
  overrides: ScenarioOverride[],
  options: { period?: string } = {},
): PanelDataset {
  if (overrides.length === 0) return dataset
  const period = options.period ?? latestPeriod(dataset)
  if (period === undefined) return dataset
  const keyed = new Map<string, number>()
  for (const o of overrides) keyed.set(`${o.place_id}::${o.indicator_key}`, o.value)
  const next = dataset.values.map((v) => {
    if (v.period !== period) return v
    const k = `${v.place_id}::${v.indicator_key}`
    if (!keyed.has(k)) return v
    return { ...v, value: keyed.get(k) as number }
  })
  return { values: next }
}
