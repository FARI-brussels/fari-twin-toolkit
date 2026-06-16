import type { ModelKind, Scenario, ScenarioOverride } from '@fari-brussels/twin-types'

/**
 * Mutable bag of overrides — what users set sliders to. Convert to a wire
 * `Scenario` when persisting (e.g. saving to a backend / localStorage).
 */
export class ScenarioState {
  private byKey = new Map<string, ScenarioOverride>()

  constructor(initial: ScenarioOverride[] = []) {
    for (const o of initial) this.set(o)
  }

  /** Add or replace an override for (place_id, indicator_key). */
  set(override: ScenarioOverride): void {
    this.byKey.set(this.key(override.place_id, override.indicator_key), override)
  }

  /** Remove one override (both keys required), or all for a place, or all. */
  clear(placeId?: string, indicatorKey?: string): void {
    if (placeId === undefined) {
      this.byKey.clear()
      return
    }
    if (indicatorKey !== undefined) {
      this.byKey.delete(this.key(placeId, indicatorKey))
      return
    }
    for (const k of [...this.byKey.keys()]) {
      if (k.startsWith(`${placeId}::`)) this.byKey.delete(k)
    }
  }

  get(placeId: string, indicatorKey: string): ScenarioOverride | undefined {
    return this.byKey.get(this.key(placeId, indicatorKey))
  }

  values(): ScenarioOverride[] {
    return [...this.byKey.values()]
  }

  get size(): number {
    return this.byKey.size
  }

  /** Snapshot into a wire `Scenario` ready to send / persist. */
  toScenario(
    id: string,
    name: string,
    options: { model?: ModelKind; basePeriod?: string; notes?: string } = {},
  ): Scenario {
    return {
      id,
      name,
      overrides: this.values(),
      ...(options.model ? { model: options.model } : {}),
      ...(options.basePeriod ? { base_period: options.basePeriod } : {}),
      ...(options.notes ? { notes: options.notes } : {}),
    }
  }

  /** Build a ScenarioState from a wire `Scenario`. */
  static fromScenario(scenario: Scenario): ScenarioState {
    return new ScenarioState(scenario.overrides)
  }

  private key(placeId: string, indicatorKey: string): string {
    return `${placeId}::${indicatorKey}`
  }
}
