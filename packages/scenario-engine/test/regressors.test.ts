import { describe, it, expect } from 'vitest'
import { fitLinear } from '../src/linear'
import { fitPolynomial2 } from '../src/polynomial'
import { fitCart } from '../src/cart'
import { fitKnn } from '../src/knn'
import { fitModel } from '../src/factory'

describe('fitLinear', () => {
  it('recovers slope and intercept of y = 2x + 1', () => {
    const f = fitLinear([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ])
    expect(f.kind).toBe('linear')
    expect(f.predict(0)).toBeCloseTo(1, 9)
    expect(f.predict(10)).toBeCloseTo(21, 9)
    expect(f.r2()).toBeCloseTo(1, 9)
  })

  it('returns a flat fit on constant y', () => {
    const f = fitLinear([
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ])
    expect(f.predict(99)).toBeCloseTo(5, 9)
  })

  it('respects sample weights', () => {
    const f = fitLinear([
      { x: 0, y: 0, weight: 1 },
      { x: 1, y: 10, weight: 100 }, // dominates
    ])
    // With one heavily weighted high-y point and one tiny zero, the line bends to fit it.
    expect(f.predict(1)).toBeGreaterThan(9.5)
  })
})

describe('fitPolynomial2', () => {
  it('recovers y = x^2 to high precision', () => {
    const samples = [-3, -2, -1, 0, 1, 2, 3].map((x) => ({ x, y: x * x }))
    const f = fitPolynomial2(samples)
    expect(f.kind).toBe('polynomial2')
    expect(f.predict(0)).toBeCloseTo(0, 6)
    expect(f.predict(4)).toBeCloseTo(16, 6)
    expect(f.r2()).toBeCloseTo(1, 6)
  })

  it('recovers a more general quadratic', () => {
    // y = 3 + 2x - 0.5x^2
    const f = fitPolynomial2([-2, -1, 0, 1, 2, 3].map((x) => ({ x, y: 3 + 2 * x - 0.5 * x * x })))
    expect(f.predict(5)).toBeCloseTo(3 + 2 * 5 - 0.5 * 25, 6)
  })
})

describe('fitCart', () => {
  it('splits at the right threshold and predicts leaf means', () => {
    // Step function: y=0 for x<5, y=10 for x>=5; 5 samples each side
    const samples = [
      ...Array.from({ length: 6 }, (_, i) => ({ x: i, y: 0 })),
      ...Array.from({ length: 6 }, (_, i) => ({ x: i + 6, y: 10 })),
    ]
    const f = fitCart(samples, { maxDepth: 2, minLeaf: 3 })
    expect(f.kind).toBe('cart')
    expect(f.predict(2)).toBeCloseTo(0, 9)
    expect(f.predict(10)).toBeCloseTo(10, 9)
  })

  it('falls back to a leaf when there are too few samples to split', () => {
    const samples = [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 3 },
    ]
    const f = fitCart(samples, { maxDepth: 3, minLeaf: 5 })
    // Whole set becomes a leaf: prediction is the mean
    expect(f.predict(99)).toBeCloseTo(2, 9)
  })
})

describe('fitKnn', () => {
  it('predicts the mean of the k nearest', () => {
    const f = fitKnn(
      [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 30 },
        { x: 9, y: 90 },
        { x: 10, y: 100 },
      ],
      { k: 3 },
    )
    expect(f.kind).toBe('knn')
    expect(f.predict(1)).toBeCloseTo((10 + 20 + 30) / 3, 9)
    expect(f.predict(10)).toBeCloseTo((30 + 90 + 100) / 3, 9)
  })

  it('falls back to fewer neighbours when there are fewer samples than k', () => {
    const f = fitKnn(
      [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
      ],
      { k: 7 },
    )
    expect(f.predict(0.5)).toBeCloseTo(2, 9)
  })
})

describe('fitModel factory', () => {
  it('routes by ModelKind', () => {
    const samples = [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ]
    expect(fitModel('linear', samples).predict(3)).toBeCloseTo(6, 9)
    expect(fitModel('polynomial2', samples).predict(3)).toBeCloseTo(6, 6)
    // knn with k=1 = nearest-neighbour at x=2 -> exact y=4
    expect(fitModel('knn', samples, { knn: { k: 1 } }).predict(2)).toBeCloseTo(4, 9)
    expect(fitModel('cart', samples, { cart: { minLeaf: 1, maxDepth: 1 } }).kind).toBe('cart')
  })
})
