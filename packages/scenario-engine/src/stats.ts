import type { Sample } from './types'

/** Weighted mean. Weight defaults to 1. */
export function weightedMean(samples: Sample[], pick: (s: Sample) => number): number {
  let num = 0
  let den = 0
  for (const s of samples) {
    const w = s.weight ?? 1
    num += w * pick(s)
    den += w
  }
  return den === 0 ? NaN : num / den
}

/**
 * Coefficient of determination of a fitted model on the given samples.
 * R² = 1 − Σw·(y − ŷ)² / Σw·(y − ȳ)². Returns NaN when variance is zero.
 */
export function rSquared(samples: Sample[], predict: (x: number) => number): number {
  if (samples.length === 0) return NaN
  const yBar = weightedMean(samples, (s) => s.y)
  let ssRes = 0
  let ssTot = 0
  for (const s of samples) {
    const w = s.weight ?? 1
    const yHat = predict(s.x)
    ssRes += w * (s.y - yHat) ** 2
    ssTot += w * (s.y - yBar) ** 2
  }
  if (ssTot === 0) return NaN
  return 1 - ssRes / ssTot
}
