import type { CartOptions, FittedRegressor, Sample } from './types'
import { rSquared, weightedMean } from './stats'

interface Leaf {
  kind: 'leaf'
  value: number
}
interface Split {
  kind: 'split'
  threshold: number
  left: Node
  right: Node
}
type Node = Leaf | Split

/**
 * Univariate regression tree (CART) by weighted variance reduction.
 * Brussels' settings: maxDepth = 3, minLeaf = 5.
 */
export function fitCart(samples: Sample[], opts: CartOptions = {}): FittedRegressor {
  const maxDepth = opts.maxDepth ?? 3
  const minLeaf = opts.minLeaf ?? 5

  const root = build(samples, 0, maxDepth, minLeaf)

  const predict = (x: number): number => {
    let node: Node = root
    while (node.kind === 'split') {
      node = x <= node.threshold ? node.left : node.right
    }
    return node.value
  }

  return {
    kind: 'cart',
    predict,
    r2: () => rSquared(samples, predict),
  }
}

function leaf(samples: Sample[]): Leaf {
  return { kind: 'leaf', value: weightedMean(samples, (s) => s.y) }
}

function weightedVariance(samples: Sample[]): { variance: number; totalWeight: number } {
  if (samples.length === 0) return { variance: 0, totalWeight: 0 }
  const mean = weightedMean(samples, (s) => s.y)
  let v = 0
  let w = 0
  for (const s of samples) {
    const wi = s.weight ?? 1
    v += wi * (s.y - mean) ** 2
    w += wi
  }
  return { variance: v, totalWeight: w }
}

function build(samples: Sample[], depth: number, maxDepth: number, minLeaf: number): Node {
  if (depth >= maxDepth || samples.length < 2 * minLeaf) return leaf(samples)

  const sorted = [...samples].sort((a, b) => a.x - b.x)
  const parent = weightedVariance(sorted)
  if (parent.totalWeight === 0) return leaf(sorted)

  let bestGain = 0
  let bestThreshold: number | null = null
  let bestLeft: Sample[] | null = null
  let bestRight: Sample[] | null = null

  // Candidate splits = midpoints between consecutive unique x values.
  for (let i = 0; i < sorted.length - 1; i++) {
    const xi = sorted[i]!.x
    const xj = sorted[i + 1]!.x
    if (xi === xj) continue
    const left = sorted.slice(0, i + 1)
    const right = sorted.slice(i + 1)
    if (left.length < minLeaf || right.length < minLeaf) continue
    const lv = weightedVariance(left)
    const rv = weightedVariance(right)
    const weighted =
      (lv.variance * lv.totalWeight + rv.variance * rv.totalWeight) / parent.totalWeight
    const gain = parent.variance / parent.totalWeight - weighted / parent.totalWeight
    if (gain > bestGain) {
      bestGain = gain
      bestThreshold = (xi + xj) / 2
      bestLeft = left
      bestRight = right
    }
  }

  if (bestThreshold === null || !bestLeft || !bestRight) return leaf(sorted)
  return {
    kind: 'split',
    threshold: bestThreshold,
    left: build(bestLeft, depth + 1, maxDepth, minLeaf),
    right: build(bestRight, depth + 1, maxDepth, minLeaf),
  }
}
