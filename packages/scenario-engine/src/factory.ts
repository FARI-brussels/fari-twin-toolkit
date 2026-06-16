import type { ModelKind } from '@fari-brussels/twin-types'
import type { CartOptions, FittedRegressor, KnnOptions, Sample } from './types'
import { fitCart } from './cart'
import { fitKnn } from './knn'
import { fitLinear } from './linear'
import { fitPolynomial2 } from './polynomial'

export interface FitModelOptions {
  cart?: CartOptions
  knn?: KnnOptions
}

/** Fit a regressor by `ModelKind` (the same enum on the wire as @fari-brussels/twin-types). */
export function fitModel(
  kind: ModelKind,
  samples: Sample[],
  options: FitModelOptions = {},
): FittedRegressor {
  switch (kind) {
    case 'linear':
      return fitLinear(samples)
    case 'polynomial2':
      return fitPolynomial2(samples)
    case 'cart':
      return fitCart(samples, options.cart)
    case 'knn':
      return fitKnn(samples, options.knn)
  }
}
