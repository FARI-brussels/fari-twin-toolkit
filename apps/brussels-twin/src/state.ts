import { reactive, computed } from 'vue'
import type { ScenarioOverride } from '@fari-brussels/twin-types'
import { panelFromTimeseries } from '@fari-brussels/scenario-engine'
import { indicators, series, years } from './data'

type IndicatorKey = (typeof indicators)[number]['key']

interface State {
  activeIndicator: IndicatorKey
  activeYear: number
  activePlaceId: string | null
  driverIndicator: IndicatorKey
  overrides: ScenarioOverride[]
}

// Defaults derive from the data, so the app works for both the bundled sample
// and the real Brussels dataset (which uses entirely different indicator keys).
const defaultOutcome = indicators[0]!.key
const defaultDriver = (indicators[1] ?? indicators[0])!.key

export const state = reactive<State>({
  activeIndicator: defaultOutcome,
  activeYear: years[years.length - 1] ?? 2024,
  activePlaceId: null,
  driverIndicator: defaultDriver,
  overrides: [],
})

/** The full panel — recomputed only when the dataset changes (here, never). */
export const dataset = panelFromTimeseries(series)

/** Where in the data we currently are. */
export const activeIndicator = computed(
  () => indicators.find((i) => i.key === state.activeIndicator) ?? indicators[0]!,
)
export const driverIndicator = computed(
  () => indicators.find((i) => i.key === state.driverIndicator) ?? indicators[0]!,
)

export function setOverride(o: ScenarioOverride): void {
  const idx = state.overrides.findIndex(
    (x) => x.place_id === o.place_id && x.indicator_key === o.indicator_key,
  )
  if (idx >= 0) state.overrides.splice(idx, 1, o)
  else state.overrides.push(o)
}

export function clearOverride(placeId: string, indicatorKey: string): void {
  const idx = state.overrides.findIndex(
    (x) => x.place_id === placeId && x.indicator_key === indicatorKey,
  )
  if (idx >= 0) state.overrides.splice(idx, 1)
}

export function clearAllOverrides(): void {
  state.overrides.length = 0
}

export function overrideFor(placeId: string, indicatorKey: string): number | undefined {
  return state.overrides.find((o) => o.place_id === placeId && o.indicator_key === indicatorKey)
    ?.value
}
