import type { FittedRegressor, Sample } from './types'
import { rSquared } from './stats'

/**
 * Weighted polynomial regression of degree 2: y = a + b·x + c·x². Built by
 * solving the 3×3 normal equations via Gaussian elimination with partial
 * pivoting (small system; fine).
 */
export function fitPolynomial2(samples: Sample[]): FittedRegressor {
  // Accumulators for the normal equations:
  // [ S0  S1  S2 ] [a]   [Sy ]
  // [ S1  S2  S3 ] [b] = [Sxy]
  // [ S2  S3  S4 ] [c]   [Sx2y]
  let s0 = 0,
    s1 = 0,
    s2 = 0,
    s3 = 0,
    s4 = 0
  let sy = 0,
    sxy = 0,
    sx2y = 0
  for (const s of samples) {
    const w = s.weight ?? 1
    const x = s.x
    const x2 = x * x
    s0 += w
    s1 += w * x
    s2 += w * x2
    s3 += w * x2 * x
    s4 += w * x2 * x2
    sy += w * s.y
    sxy += w * x * s.y
    sx2y += w * x2 * s.y
  }
  const m: number[][] = [
    [s0, s1, s2, sy],
    [s1, s2, s3, sxy],
    [s2, s3, s4, sx2y],
  ]
  const coeffs = gaussianElim3(m) ?? [0, 0, 0]
  const [a, b, c] = coeffs as [number, number, number]
  const predict = (x: number) => a + b * x + c * x * x
  return {
    kind: 'polynomial2',
    predict,
    r2: () => rSquared(samples, predict),
  }
}

/** Gaussian elimination on a 3×4 augmented matrix; returns [x,y,z] or null if singular. */
function gaussianElim3(m: number[][]): [number, number, number] | null {
  // Partial pivoting on the first column
  for (let i = 0; i < 3; i++) {
    // find pivot row
    let pivot = i
    let max = Math.abs(m[i]![i]!)
    for (let r = i + 1; r < 3; r++) {
      const v = Math.abs(m[r]![i]!)
      if (v > max) {
        pivot = r
        max = v
      }
    }
    if (max < 1e-12) return null
    if (pivot !== i) [m[i], m[pivot]] = [m[pivot]!, m[i]!]
    // eliminate below
    for (let r = i + 1; r < 3; r++) {
      const factor = m[r]![i]! / m[i]![i]!
      for (let c = i; c < 4; c++) m[r]![c]! -= factor * m[i]![c]!
    }
  }
  // back-substitute
  const x = [0, 0, 0]
  for (let i = 2; i >= 0; i--) {
    let sum = m[i]![3]!
    for (let c = i + 1; c < 3; c++) sum -= m[i]![c]! * x[c]!
    x[i] = sum / m[i]![i]!
  }
  return [x[0]!, x[1]!, x[2]!]
}
