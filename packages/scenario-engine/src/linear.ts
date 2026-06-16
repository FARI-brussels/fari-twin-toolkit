import type { FittedRegressor, Sample } from './types'
import { rSquared, weightedMean } from './stats'

/**
 * Weighted ordinary least squares: y = a + b·x.
 * Closed-form via centered sums; samples with weight default to 1.
 */
export function fitLinear(samples: Sample[]): FittedRegressor {
  const xBar = weightedMean(samples, (s) => s.x)
  const yBar = weightedMean(samples, (s) => s.y)
  let num = 0
  let den = 0
  for (const s of samples) {
    const w = s.weight ?? 1
    const dx = s.x - xBar
    num += w * dx * (s.y - yBar)
    den += w * dx * dx
  }
  const b = den === 0 ? 0 : num / den
  const a = Number.isFinite(yBar) ? yBar - b * xBar : 0
  const predict = (x: number) => a + b * x
  return {
    kind: 'linear',
    predict,
    r2: () => rSquared(samples, predict),
  }
}
