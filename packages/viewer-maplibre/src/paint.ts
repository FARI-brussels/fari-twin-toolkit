/**
 * Pure spec → MapLibre paint mapping. No `maplibre-gl` import lives here, so this
 * file is fully unit-testable without a browser or WebGL. The adapter consumes
 * these helpers; keeping the math here (and mirroring viewer-core's color ramps)
 * is what lets MapLibre and Cesium agree on a colour for the same feature.
 */
import type { ColorRamp, ColorStop, StyleSpec } from '@fari-brussels/viewer-core'

/**
 * A MapLibre style expression. MapLibre types these precisely per-property; we
 * keep a permissive alias so these helpers stay dependency-free. The adapter
 * casts them onto MapLibre's layer types at the (single) renderer boundary.
 */
export type MapLibreExpression = unknown[]

/** A paint value is either a constant or a data-driven expression. */
export type PaintValue<T> = T | MapLibreExpression

export type PaintProps = Record<string, PaintValue<string | number>>

const DEFAULT_FILL = '#888888'
const DEFAULT_FILL_OPACITY = 0.6
const DEFAULT_POINT_RADIUS = 5
const DEFAULT_STROKE = '#ffffff'
const DEFAULT_STROKE_WIDTH = 1

/** MapLibre requires monotonically increasing input stops. */
function sortStops(stops: ColorStop[]): ColorStop[] {
  return [...stops].sort((a, b) => a.value - b.value)
}

/**
 * Build a MapLibre colour value from a `colorBy` ramp:
 *
 * - one stop → a plain colour string (constant; both expression kinds reject a
 *   single stop),
 * - `interpolate` (default) → a GPU `['interpolate', ['linear'], …]` gradient,
 * - `step` → a piecewise-constant `['step', …]` threshold ramp.
 *
 * The feature value is read with `['to-number', ['get', prop], firstStopValue]`
 * so non-numeric / missing properties clamp to the first stop instead of
 * throwing — the same graceful fallback `resolveFeatureColor` gives Cesium.
 *
 * Because MapLibre evaluates this on the GPU, swapping the expression via
 * `setPaintProperty` recolours every feature in a single animated transition.
 */
export function colorByExpression(ramp: ColorRamp): PaintValue<string> {
  const stops = sortStops(ramp.stops)
  if (stops.length === 0) throw new Error('color ramp needs at least one stop')
  const first = stops[0] as ColorStop
  if (stops.length === 1) return first.color

  const input: MapLibreExpression = ['to-number', ['get', ramp.property], first.value]

  if (ramp.mode === 'step') {
    // ['step', input, color0, v1, color1, v2, color2, …] — color0 holds below v1.
    const expr: unknown[] = ['step', input, first.color]
    for (let i = 1; i < stops.length; i++) {
      const stop = stops[i] as ColorStop
      expr.push(stop.value, stop.color)
    }
    return expr
  }

  const expr: unknown[] = ['interpolate', ['linear'], input]
  for (const stop of stops) expr.push(stop.value, stop.color)
  return expr
}

/** Colour for points: colorBy expression if set, else pointColor → fillColor → default. */
function pointColor(style: StyleSpec | undefined): PaintValue<string> {
  if (style?.colorBy) return colorByExpression(style.colorBy)
  return style?.pointColor ?? style?.fillColor ?? DEFAULT_FILL
}

/** Colour for polygons: colorBy expression if set, else fillColor → default. */
function areaColor(style: StyleSpec | undefined): PaintValue<string> {
  if (style?.colorBy) return colorByExpression(style.colorBy)
  return style?.fillColor ?? DEFAULT_FILL
}

/** Paint for the `circle` sub-layer (Point / MultiPoint features). */
export function circlePaint(style?: StyleSpec): PaintProps {
  return {
    'circle-color': pointColor(style),
    'circle-radius': style?.pointRadius ?? DEFAULT_POINT_RADIUS,
    'circle-opacity': style?.fillOpacity ?? 1,
    'circle-stroke-color': style?.strokeColor ?? DEFAULT_STROKE,
    'circle-stroke-width': style?.strokeWidth ?? DEFAULT_STROKE_WIDTH,
  }
}

/** Paint for the `fill` sub-layer (Polygon / MultiPolygon features). */
export function fillPaint(style?: StyleSpec): PaintProps {
  return {
    'fill-color': areaColor(style),
    'fill-opacity': style?.fillOpacity ?? DEFAULT_FILL_OPACITY,
  }
}

/** Paint for the `line` sub-layer (LineString features and polygon outlines). */
export function linePaint(style?: StyleSpec): PaintProps {
  return {
    'line-color': style?.strokeColor ?? DEFAULT_STROKE,
    'line-width': style?.strokeWidth ?? DEFAULT_STROKE_WIDTH,
  }
}
