import type { ScenarioOverride } from '@fari-brussels/twin-types'
import type { ToolDef } from '../tool'

/**
 * Tool builders for common toolkit operations. Each builder takes the host
 * app's handler (which usually updates reactive state or calls into
 * scenario-engine / viewer-vue) and returns a ToolDef ready to register on a
 * Conversation.
 *
 * Tool names are snake_case to read naturally in LLM transcripts.
 */

export function setActiveIndicatorTool(
  handler: (input: { indicator_key: string }) => void | Promise<void>,
): ToolDef<{ indicator_key: string }, { ok: true }> {
  return {
    name: 'set_active_indicator',
    description:
      'Display a specific indicator on the map. Use when the user mentions an indicator by name or topic (e.g. unemployment, income, population growth).',
    inputSchema: {
      type: 'object',
      required: ['indicator_key'],
      properties: {
        indicator_key: {
          type: 'string',
          description:
            'Machine key of the indicator (snake_case, e.g. unemployment_rate, income_per_capita).',
        },
      },
    },
    handler: async (input) => {
      await handler(input)
      return { ok: true }
    },
  }
}

export function setActiveYearTool(
  handler: (input: { year: number }) => void | Promise<void>,
): ToolDef<{ year: number }, { ok: true }> {
  return {
    name: 'set_active_year',
    description:
      'Show the indicator values for a specific year. Use when the user references a year, decade, or time range.',
    inputSchema: {
      type: 'object',
      required: ['year'],
      properties: {
        year: { type: 'integer', description: 'Four-digit year, e.g. 2024.' },
      },
    },
    handler: async (input) => {
      await handler(input)
      return { ok: true }
    },
  }
}

export function setActivePlaceTool(
  handler: (input: { place_id: string }) => void | Promise<void>,
): ToolDef<{ place_id: string }, { ok: true }> {
  return {
    name: 'set_active_place',
    description:
      'Focus on a specific place (commune, district, site). Use when the user names a location.',
    inputSchema: {
      type: 'object',
      required: ['place_id'],
      properties: {
        place_id: { type: 'string', description: 'Place id (e.g. NIS code).' },
      },
    },
    handler: async (input) => {
      await handler(input)
      return { ok: true }
    },
  }
}

export function applyOverridesTool(
  handler: (input: { overrides: ScenarioOverride[] }) => void | Promise<void>,
): ToolDef<{ overrides: ScenarioOverride[] }, { ok: true; applied: number }> {
  return {
    name: 'apply_scenario_overrides',
    description:
      'Apply what-if overrides (forced values for an indicator at one or more places) to the active scenario. Use when the user asks "what if X were Y at place Z".',
    inputSchema: {
      type: 'object',
      required: ['overrides'],
      properties: {
        overrides: {
          type: 'array',
          description: 'One entry per (place, indicator) override.',
          items: {
            type: 'object',
            required: ['place_id', 'indicator_key', 'value'],
            properties: {
              place_id: { type: 'string' },
              indicator_key: { type: 'string' },
              value: { type: 'number' },
            },
          },
        },
      },
    },
    handler: async (input) => {
      await handler(input)
      return { ok: true, applied: input.overrides.length }
    },
  }
}

export interface PredictIndicatorRequest {
  place_id: string
  driver_key: string
  outcome_key: string
  /** linear | polynomial2 | cart | knn */
  model: string
  period?: string
}
export interface PredictIndicatorResponse {
  baseline: number | null
  predicted: number | null
  delta: number | null
  r2: number
}

export function predictIndicatorTool(
  handler: (input: PredictIndicatorRequest) => Promise<PredictIndicatorResponse>,
): ToolDef<PredictIndicatorRequest, PredictIndicatorResponse> {
  return {
    name: 'predict_indicator',
    description:
      'Predict an outcome indicator for a place from a driver indicator, using a regression model fit across places. Returns baseline / predicted / delta / r2. Use to answer "what does X become if Y changes".',
    inputSchema: {
      type: 'object',
      required: ['place_id', 'driver_key', 'outcome_key', 'model'],
      properties: {
        place_id: { type: 'string' },
        driver_key: { type: 'string', description: 'Independent variable (what the user moves).' },
        outcome_key: { type: 'string', description: 'Dependent variable (what we predict).' },
        model: { type: 'string', enum: ['linear', 'polynomial2', 'cart', 'knn'] },
        period: {
          type: 'string',
          description: 'Period to fit and predict at (e.g. "2024"). Defaults to latest.',
        },
      },
    },
    handler,
  }
}

export function flyToTool(
  handler: (input: { lon: number; lat: number; height?: number }) => void | Promise<void>,
): ToolDef<{ lon: number; lat: number; height?: number }, { ok: true }> {
  return {
    name: 'fly_to',
    description: 'Fly the viewer camera to a longitude/latitude (and optional height in metres).',
    inputSchema: {
      type: 'object',
      required: ['lon', 'lat'],
      properties: {
        lon: { type: 'number' },
        lat: { type: 'number' },
        height: { type: 'number', description: 'Metres above the ground. Default ~4000.' },
      },
    },
    handler: async (input) => {
      await handler(input)
      return { ok: true }
    },
  }
}
