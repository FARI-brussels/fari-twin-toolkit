import type { RendererAdapter } from './adapter'
import type { LayerKind } from './layer-spec'
import { UnsupportedLayerError } from './errors'

export interface CapabilityHolder {
  readonly name: string
  readonly capabilities: ReadonlySet<LayerKind>
}

export function supports(holder: CapabilityHolder, kind: LayerKind): boolean {
  return holder.capabilities.has(kind)
}

export function assertSupported(holder: CapabilityHolder, kind: LayerKind): void {
  if (!holder.capabilities.has(kind)) throw new UnsupportedLayerError(holder.name, kind)
}

/**
 * A renderer that can be selected before instantiation. Registering a new
 * renderer is just: declare its name + capabilities + a factory.
 */
export interface AdapterDescriptor {
  name: string
  capabilities: ReadonlySet<LayerKind>
  create: () => RendererAdapter
}

/**
 * Pick the first descriptor (in caller-defined preference order, cheapest
 * first) that supports every required layer kind. This is how an app gets the
 * lightest renderer that can draw what it needs.
 */
export function selectAdapter(
  descriptors: readonly AdapterDescriptor[],
  requiredKinds: readonly LayerKind[],
): AdapterDescriptor | undefined {
  return descriptors.find((d) => requiredKinds.every((k) => d.capabilities.has(k)))
}
