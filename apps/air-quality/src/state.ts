/**
 * App state. One reactive object plus a couple of derived getters — the whole UI
 * (map, controls, legend, detail) reads from here, so changing a source or norm
 * is a single assignment that ripples everywhere reactively.
 */
import { computed, reactive } from 'vue'
import { defaultSourceId, sources } from './data/sources'
import { defaultNormId, norms } from './data/norms'

export interface Selected {
  value: number
  properties: Record<string, unknown>
  lon?: number
  lat?: number
}

export interface Stats {
  count: number
  min: number
  max: number
}

interface State {
  sourceId: string
  normId: string
  loading: boolean
  selected: Selected | null
  stats: Stats | null
}

export const state = reactive<State>({
  sourceId: defaultSourceId,
  normId: defaultNormId,
  loading: false,
  selected: null,
  stats: null,
})

export const activeSource = computed(
  () => sources.find((s) => s.id === state.sourceId) ?? sources[0]!,
)
export const activeNorm = computed(() => norms.find((n) => n.id === state.normId) ?? norms[0]!)
