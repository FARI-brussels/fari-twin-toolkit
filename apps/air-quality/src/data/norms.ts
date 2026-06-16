/**
 * NO₂ colour ramps, expressed as viewer-core `ColorStop[]` in **step** mode:
 * each stop's colour holds until the next stop, so the map shows hard bands, not
 * a blend. This is exactly how an air-quality legend reads — "within the limit"
 * vs "over it" — and it's the same `mode: 'step'` the Cesium adapter honours, so
 * the choice of renderer never changes the science.
 *
 * `measured` is a perceptual gradient (no legal meaning); the others are
 * legislative / health thresholds: green below the limit, red at or above it.
 * Ported from the original demo's `colorMap.ts`.
 */
import type { ColorStop } from '@fari-brussels/viewer-core'

export interface Norm {
  id: string
  label: string
  blurb: string
  /** Single limit value (µg/m³) for threshold norms; null for the gradient. */
  limit: number | null
  stops: ColorStop[]
}

const WITHIN = '#2BB673' // green — within the limit
const OVER = '#B32A2D' // FARI "not-ok" red — over the limit

export const norms: Norm[] = [
  {
    id: 'measured',
    label: 'Measured',
    blurb: 'Raw concentration with no legal threshold — blue (clean) to purple (high).',
    limit: null,
    stops: [
      { value: 0, color: '#0000FF' },
      { value: 2, color: '#0099FF' },
      { value: 5, color: '#009900' },
      { value: 7, color: '#00FF00' },
      { value: 10, color: '#FFFF00' },
      { value: 15, color: '#FFBB00' },
      { value: 20, color: '#FF6600' },
      { value: 25, color: '#FF0000' },
      { value: 30, color: '#CC0000' },
      { value: 40, color: '#990099' },
    ],
  },
  {
    id: 'eu-current',
    label: 'EU limit',
    blurb: 'Current EU annual limit for NO₂: 40 µg/m³.',
    limit: 40,
    stops: [
      { value: 0, color: WITHIN },
      { value: 40, color: OVER },
    ],
  },
  {
    id: 'eu-2030',
    label: 'EU 2030',
    blurb: 'Stricter EU annual limit taking effect in 2030: 20 µg/m³.',
    limit: 20,
    stops: [
      { value: 0, color: WITHIN },
      { value: 20, color: OVER },
    ],
  },
  {
    id: 'who',
    label: 'WHO',
    blurb: 'World Health Organization health-based guideline: 10 µg/m³.',
    limit: 10,
    stops: [
      { value: 0, color: WITHIN },
      { value: 10, color: OVER },
    ],
  },
]

export const defaultNormId = 'eu-current'
