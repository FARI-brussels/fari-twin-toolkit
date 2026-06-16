/**
 * Declarative, renderer-agnostic styling. Adapters translate these into their
 * own primitives (Cesium materials, MapLibre paint, Three materials). No
 * callbacks referencing a specific renderer ever appear here.
 */

export interface ColorStop {
  value: number
  /** Hex color (#rgb or #rrggbb). */
  color: string
}

/**
 * Data-driven coloring: pick a color from a numeric property and a set of stops.
 *
 * - `interpolate` (default): blend smoothly between adjacent stops — a gradient.
 * - `step`: piecewise-constant — each stop's color holds until the next stop's
 *   value, so `[{0,green},{40,red}]` paints green below 40 and red at/above it.
 *   This is how threshold legends work (e.g. air-quality norms: green = within
 *   the limit, red = over it).
 */
export interface ColorRamp {
  property: string
  stops: ColorStop[]
  mode?: 'interpolate' | 'step'
}

export interface StyleSpec {
  fillColor?: string
  fillOpacity?: number
  strokeColor?: string
  strokeWidth?: number
  pointColor?: string
  pointRadius?: number
  /** Emoji or icon identifier/URL the adapter knows how to resolve. */
  icon?: string
  iconSize?: number
  /** Overrides fillColor with a value interpolated from feature properties. */
  colorBy?: ColorRamp
}

/** Parse a #rgb or #rrggbb color into [r, g, b] (0–255). */
export function parseHexColor(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (h.length !== 6) throw new Error(`Invalid hex color: ${hex}`)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Format [r, g, b] (0–255) as #rrggbb. */
export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/**
 * Interpolate a color from a ramp at the given value. Stops are sorted by value;
 * values outside the range clamp to the nearest stop.
 */
export function interpolateColorRamp(stops: ColorStop[], value: number): string {
  if (stops.length === 0) throw new Error('color ramp needs at least one stop')
  const sorted = [...stops].sort((a, b) => a.value - b.value)
  const first = sorted[0] as ColorStop
  const last = sorted[sorted.length - 1] as ColorStop
  if (value <= first.value) return first.color
  if (value >= last.value) return last.color
  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i] as ColorStop
    const hi = sorted[i + 1] as ColorStop
    if (value >= lo.value && value <= hi.value) {
      const t = (value - lo.value) / (hi.value - lo.value)
      const [r1, g1, b1] = parseHexColor(lo.color)
      const [r2, g2, b2] = parseHexColor(hi.color)
      return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
    }
  }
  return last.color
}

/**
 * Piecewise-constant color: return the color of the highest stop whose value is
 * `<= value` (values below the first stop clamp to it). The inverse of
 * interpolation — no blending, hard bands. Matches a threshold/norm legend.
 */
export function stepColorRamp(stops: ColorStop[], value: number): string {
  if (stops.length === 0) throw new Error('color ramp needs at least one stop')
  const sorted = [...stops].sort((a, b) => a.value - b.value)
  let color = (sorted[0] as ColorStop).color
  for (const stop of sorted) {
    if (value >= stop.value) color = stop.color
    else break
  }
  return color
}

/** Resolve a color from a ramp at the given value, honouring the ramp's mode. */
export function colorRampAt(ramp: ColorRamp, value: number): string {
  return ramp.mode === 'step'
    ? stepColorRamp(ramp.stops, value)
    : interpolateColorRamp(ramp.stops, value)
}

/** Resolve the effective fill color for a feature given its properties. */
export function resolveFeatureColor(
  style: StyleSpec,
  properties: Record<string, unknown> | null | undefined,
): string | undefined {
  if (style.colorBy) {
    const raw = (properties ?? {})[style.colorBy.property]
    const value = Number(raw)
    if (Number.isFinite(value)) return colorRampAt(style.colorBy, value)
  }
  return style.fillColor
}
