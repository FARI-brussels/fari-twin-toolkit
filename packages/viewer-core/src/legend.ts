/**
 * Gradient sampling + legend generation. The renderer-agnostic home for the
 * color-scale helpers that previously lived per-app (the DT's `getValueColor` /
 * `createGradientLegend` / `GRADIENT_STOPS`). Apps keep their *thresholds* and
 * property extractors as data; the math lives here.
 */
import { parseHexColor, rgbToHex, type ColorRamp, type ColorStop } from './style'

/**
 * Default green → yellow → orange → red scale (good/low → bad/high). Hex form of
 * the DT's canonical `GRADIENT_STOPS`.
 */
export const DEFAULT_GRADIENT: readonly string[] = ['#00c800', '#ffff00', '#ffa500', '#ff0000']

export interface LegendItem {
  /** Swatch color (#rrggbb). */
  color: string
  label: string
}

export interface Legend {
  title: string
  items: LegendItem[]
}

/**
 * Sample an evenly-spaced hex palette at `t` ∈ [0, 1], blending the two adjacent
 * colors. `t` is clamped to the range.
 */
export function sampleGradient(palette: readonly string[], t: number): string {
  if (palette.length === 0) throw new Error('gradient needs at least one color')
  const clamped = Math.max(0, Math.min(1, t))
  const segments = palette.length - 1
  if (segments === 0) return palette[0] as string
  const scaled = clamped * segments
  const i = Math.min(Math.floor(scaled), segments - 1)
  const localT = scaled - i
  const [r1, g1, b1] = parseHexColor(palette[i] as string)
  const [r2, g2, b2] = parseHexColor(palette[i + 1] as string)
  return rgbToHex(r1 + (r2 - r1) * localT, g1 + (g2 - g1) * localT, b1 + (b2 - b1) * localT)
}

/** Color for a value within `[min, max]`, sampled from `palette`. */
export function valueColor(
  value: number,
  min: number,
  max: number,
  palette: readonly string[] = DEFAULT_GRADIENT,
): string {
  const span = max - min
  return sampleGradient(palette, span === 0 ? 0 : (value - min) / span)
}

/**
 * Build a `colorBy` ramp by spreading a palette evenly across `[min, max]`, so a
 * feature property drives the fill. Pair with `resolveFeatureColor`.
 */
export function rampFromRange(
  property: string,
  min: number,
  max: number,
  opts: { mode?: 'interpolate' | 'step'; palette?: readonly string[] } = {},
): ColorRamp {
  const palette = opts.palette ?? DEFAULT_GRADIENT
  const last = Math.max(1, palette.length - 1)
  const stops: ColorStop[] = palette.map((color, i) => ({
    value: min + ((max - min) * i) / last,
    color,
  }))
  return { property, stops, mode: opts.mode ?? 'interpolate' }
}

export interface GradientLegendOptions {
  /** Number of bands (min 2). Default 4. */
  steps?: number
  /** Unit suffix appended to each label (e.g. `' µg/m³'`). */
  unit?: string
  title?: string
  palette?: readonly string[]
}

/**
 * Build a banded legend for a `[min, max]` gradient: a `≤ x` first band, `> x`
 * last band, and `x - y` bands between, each with its swatch color.
 *
 * Based on the DT's `createGradientLegend`, with one fix: bands are equal-width
 * intervals (`range / steps`), so the last band reads `> {second-to-last
 * boundary}` rather than the DT's `> {max}` (which mislabeled the top band as
 * starting at the maximum). Swatch colors still span the full palette.
 */
export function gradientLegend(min: number, max: number, opts: GradientLegendOptions = {}): Legend {
  const steps = Math.max(2, opts.steps ?? 4)
  const unit = opts.unit ?? ''
  const palette = opts.palette ?? DEFAULT_GRADIENT
  const range = max - min
  const items: LegendItem[] = []
  for (let i = 0; i < steps; i++) {
    const color = sampleGradient(palette, i / (steps - 1))
    const start = min + (range * i) / steps
    const end = min + (range * (i + 1)) / steps
    let label: string
    if (i === 0) label = `≤ ${Math.round(end)}${unit}`
    else if (i === steps - 1) label = `> ${Math.round(start)}${unit}`
    else label = `${Math.round(start)} - ${Math.round(end)}${unit}`
    items.push({ color, label })
  }
  return { title: opts.title ?? '', items }
}
