import { describe, it, expect } from 'vitest'
import {
  applyOverridesTool,
  flyToTool,
  predictIndicatorTool,
  setActiveIndicatorTool,
  setActivePlaceTool,
  setActiveYearTool,
  type PredictIndicatorRequest,
  type PredictIndicatorResponse,
} from '../src/tools/domain'

describe('domain tools', () => {
  it('setActiveIndicatorTool delegates to the handler', async () => {
    let received: string | null = null
    const tool = setActiveIndicatorTool(({ indicator_key }) => {
      received = indicator_key
    })
    const result = await tool.handler({ indicator_key: 'unemployment_rate' })
    expect(received).toBe('unemployment_rate')
    expect(result).toEqual({ ok: true })
    expect(tool.inputSchema.required).toEqual(['indicator_key'])
  })

  it('setActiveYearTool / setActivePlaceTool / flyToTool wire up cleanly', async () => {
    const ys: number[] = []
    const ps: string[] = []
    const flights: Array<{ lon: number; lat: number }> = []
    const y = setActiveYearTool((i) => void ys.push(i.year))
    const p = setActivePlaceTool((i) => void ps.push(i.place_id))
    const f = flyToTool((i) => void flights.push({ lon: i.lon, lat: i.lat }))
    await y.handler({ year: 2024 })
    await p.handler({ place_id: '21004' })
    await f.handler({ lon: 4.35, lat: 50.85 })
    expect(ys).toEqual([2024])
    expect(ps).toEqual(['21004'])
    expect(flights).toEqual([{ lon: 4.35, lat: 50.85 }])
  })

  it('applyOverridesTool reports the count applied', async () => {
    let applied = 0
    const tool = applyOverridesTool(({ overrides }) => {
      applied = overrides.length
    })
    const out = await tool.handler({
      overrides: [
        { place_id: 'A', indicator_key: 'x', value: 1 },
        { place_id: 'B', indicator_key: 'x', value: 2 },
      ],
    })
    expect(applied).toBe(2)
    expect(out).toEqual({ ok: true, applied: 2 })
  })

  it('predictIndicatorTool forwards the full request and returns the response', async () => {
    const tool = predictIndicatorTool(
      async (req: PredictIndicatorRequest): Promise<PredictIndicatorResponse> => {
        expect(req.model).toBe('linear')
        return { baseline: 9, predicted: 21, delta: 12, r2: 1 }
      },
    )
    const out = await tool.handler({
      place_id: 'C',
      driver_key: 'x',
      outcome_key: 'y',
      model: 'linear',
    })
    expect(out).toEqual({ baseline: 9, predicted: 21, delta: 12, r2: 1 })
  })
})
