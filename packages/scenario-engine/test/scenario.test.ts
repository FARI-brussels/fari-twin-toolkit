import { describe, it, expect } from 'vitest'
import { ScenarioState } from '../src/scenario'

describe('ScenarioState', () => {
  it('sets, replaces, and reads overrides', () => {
    const s = new ScenarioState()
    s.set({ place_id: 'A', indicator_key: 'x', value: 1 })
    s.set({ place_id: 'A', indicator_key: 'x', value: 2 })
    expect(s.get('A', 'x')?.value).toBe(2)
    expect(s.size).toBe(1)
  })

  it('clears one, all-for-place, and everything', () => {
    const s = new ScenarioState([
      { place_id: 'A', indicator_key: 'x', value: 1 },
      { place_id: 'A', indicator_key: 'y', value: 2 },
      { place_id: 'B', indicator_key: 'x', value: 3 },
    ])
    s.clear('A', 'x')
    expect(s.get('A', 'x')).toBeUndefined()
    expect(s.size).toBe(2)

    s.clear('A')
    expect(s.get('A', 'y')).toBeUndefined()
    expect(s.size).toBe(1)

    s.clear()
    expect(s.size).toBe(0)
  })

  it('round-trips through the wire Scenario shape', () => {
    const a = new ScenarioState([{ place_id: 'A', indicator_key: 'x', value: 7 }])
    const wire = a.toScenario('s1', 'demo', { model: 'linear', basePeriod: '2024' })
    expect(wire).toMatchObject({
      id: 's1',
      name: 'demo',
      model: 'linear',
      base_period: '2024',
    })
    const b = ScenarioState.fromScenario(wire)
    expect(b.get('A', 'x')?.value).toBe(7)
  })
})
