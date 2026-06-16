import type { ModelKind } from '@fari-brussels/twin-types'

export interface Sample {
  x: number
  y: number
  weight?: number
}

export interface FittedRegressor {
  readonly kind: ModelKind
  /** Predicted y for the given x. */
  predict(x: number): number
  /** Coefficient of determination on the samples used to fit (NaN if undefined). */
  r2(): number
}

export interface CartOptions {
  /** Maximum tree depth (root depth = 0). Brussels default: 3. */
  maxDepth?: number
  /** Minimum samples per leaf. Brussels default: 5. */
  minLeaf?: number
}

export interface KnnOptions {
  /** Number of neighbours to average. Brussels default: 7. */
  k?: number
}
