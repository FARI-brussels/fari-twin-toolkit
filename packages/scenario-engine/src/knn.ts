import type { FittedRegressor, KnnOptions, Sample } from './types'
import { rSquared } from './stats'

/**
 * k-nearest-neighbours regression with min-max normalization on x. Brussels'
 * default: k = 7. Falls back to fewer neighbours when there aren't enough
 * samples.
 */
export function fitKnn(samples: Sample[], opts: KnnOptions = {}): FittedRegressor {
  const k = Math.min(opts.k ?? 7, samples.length)
  const xs = samples.map((s) => s.x)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const span = xMax - xMin || 1

  const norm = (x: number) => (x - xMin) / span
  const normalized = samples.map((s) => ({ nx: norm(s.x), y: s.y, w: s.weight ?? 1 }))

  const predict = (x: number): number => {
    if (samples.length === 0) return NaN
    const qx = norm(x)
    // sort by distance, take k nearest, weighted mean of their y
    const ranked = normalized
      .map((s) => ({ ...s, d: Math.abs(s.nx - qx) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
    let num = 0
    let den = 0
    for (const r of ranked) {
      num += r.w * r.y
      den += r.w
    }
    return den === 0 ? NaN : num / den
  }

  return {
    kind: 'knn',
    predict,
    r2: () => rSquared(samples, predict),
  }
}
