/**
 * FARI brand gradients. Source: FARI Brand Book, section 05 (Main Gradients,
 * Accent Gradients). Abstracted from the FARI logos; use as overlays,
 * backgrounds or fills. Accent (purple) gradients follow the same sparing-use
 * rule as the purple accent color.
 */

export interface GradientStop {
  /** Position along the gradient, 0–100 (%). */
  offset: number
  /** CSS color (hex). */
  color: string
}

export type Gradient = readonly GradientStop[]

/** Main brand gradients (blue/teal). */
export const mainGradients = {
  /** Teal → deep blue. */
  g1: [
    { offset: 0, color: '#00DCBE' },
    { offset: 25, color: '#00BAB5' },
    { offset: 75, color: '#00639F' },
    { offset: 100, color: '#1D4590' },
  ],
  /** Pale teal → teal. */
  g2: [
    { offset: 0, color: '#A6F3E8' },
    { offset: 100, color: '#00DCBE' },
  ],
  /** Teal → white (fade). */
  g3: [
    { offset: 0, color: '#00DCBE' },
    { offset: 15, color: '#22E1C7' },
    { offset: 50, color: '#7AEDDD' },
    { offset: 100, color: '#FFFFFF' },
  ],
  /** Soft blue → deep blue. */
  g4: [
    { offset: 0, color: '#A6BCDA' },
    { offset: 100, color: '#003F96' },
  ],
} as const satisfies Record<string, Gradient>

/** Accent gradients (purple) — sparing use only. */
export const accentGradients = {
  /** Web blue → purple. */
  g1: [
    { offset: 0, color: '#2E4FBF' },
    { offset: 100, color: '#8161CC' },
  ],
  /** White → purple. */
  g2: [
    { offset: 0, color: '#FFFFFF' },
    { offset: 100, color: '#8161CC' },
  ],
} as const satisfies Record<string, Gradient>

/** Render a gradient as a CSS `linear-gradient(...)` value. */
export function toCssLinearGradient(stops: Gradient, angle = '90deg'): string {
  const body = stops.map((s) => `${s.color} ${s.offset}%`).join(', ')
  return `linear-gradient(${angle}, ${body})`
}

export type MainGradient = keyof typeof mainGradients
export type AccentGradient = keyof typeof accentGradients
