import type { LayerKind } from './layer-spec'

export class UnsupportedLayerError extends Error {
  constructor(
    readonly adapter: string,
    readonly kind: LayerKind,
  ) {
    super(`Adapter "${adapter}" does not support layer kind "${kind}"`)
    this.name = 'UnsupportedLayerError'
  }
}

export class DuplicateLayerError extends Error {
  constructor(readonly id: string) {
    super(`Layer "${id}" already exists`)
    this.name = 'DuplicateLayerError'
  }
}

export class LayerNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Layer "${id}" not found`)
    this.name = 'LayerNotFoundError'
  }
}
