import type { ModelKind, ScenarioOverride } from '@fari-brussels/twin-types'
import { applyOverrides, latestPeriod, pairs, valueOf, type PanelDataset } from './dataset'
import { fitModel, type FitModelOptions } from './factory'

export interface PredictIndicatorInput {
  dataset: PanelDataset
  /** The independent ("driver") indicator key — what the user is moving. */
  driverKey: string
  /** The dependent ("outcome") indicator key — what we predict. */
  outcomeKey: string
  /** Which place to predict for. */
  placeId: string
  /** Period to fit & predict at (defaults to dataset's latest). */
  period?: string
  /** Regression model to use. */
  model: ModelKind
  /** Optional scenario overrides applied before predicting. */
  overrides?: ScenarioOverride[]
  /** Per-model options. */
  options?: FitModelOptions
}

export interface PredictIndicatorResult {
  baseline: number | null
  predicted: number | null
  delta: number | null
  r2: number
}

/**
 * The core what-if: fit `outcome ~ driver` across all places, then predict the
 * outcome for one place under a scenario (overrides applied to the driver value
 * before prediction). Brussels' what-if expressed once, reusable everywhere.
 */
export function predictIndicator(input: PredictIndicatorInput): PredictIndicatorResult {
  const period = input.period ?? latestPeriod(input.dataset)
  const samples = pairs(input.dataset, input.driverKey, input.outcomeKey, period)
  const fitted = fitModel(input.model, samples, input.options ?? {})

  const baselineY = valueOf(input.dataset, input.placeId, input.outcomeKey, period)
  const baselineX = valueOf(input.dataset, input.placeId, input.driverKey, period)
  const baseline = typeof baselineY === 'number' ? baselineY : null

  // Effective driver value under the scenario
  const overridden = input.overrides
    ? applyOverrides(input.dataset, input.overrides, { period })
    : input.dataset
  const drivenX = valueOf(overridden, input.placeId, input.driverKey, period)

  if (typeof drivenX !== 'number') {
    return { baseline, predicted: null, delta: null, r2: fitted.r2() }
  }

  const predictedY = fitted.predict(drivenX)
  // If the driver wasn't overridden and we have a real baseline, the model's
  // prediction differs from the observed baseline by the regression's residual.
  // Express the "what-if delta" relative to what the model would predict at the
  // *original* x — so a no-op scenario yields zero delta.
  const referenceY =
    typeof baselineX === 'number' ? fitted.predict(baselineX) : (baseline ?? predictedY)
  const delta = predictedY - referenceY

  return { baseline, predicted: predictedY, delta, r2: fitted.r2() }
}
