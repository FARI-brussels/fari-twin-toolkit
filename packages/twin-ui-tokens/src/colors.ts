/**
 * FARI brand colors. Source: FARI Brand Book, section 05 (Colors).
 *
 * Pairing guidance (brand book, "Color pairing guidelines"):
 * - Brand colors may be used as standalone elements or as background fields
 *   with white typography.
 * - Cross-combining two brand colors as text + background is discouraged for
 *   accessibility — prefer white type on a brand-color field.
 */

/** Primary palette — the core brand identity. */
export const brandColors = {
  /** FARI Blue — deep institutional blue. RGB 24, 62, 145. */
  blue: '#183E91',
  /** FARI Web Blue — brighter blue for digital UI. RGB 46, 79, 191. */
  webBlue: '#2E4FBF',
  /** FARI Lighthouse Blue — the teal accent ("the dot"). RGB 100, 216, 191. */
  lighthouseBlue: '#64D8BF',
} as const

/** Secondary palette — neutral foundation. */
export const neutralColors = {
  /** FARI Black. RGB 24, 23, 22. */
  black: '#181716',
  /** FARI White. */
  white: '#FFFFFF',
} as const

/**
 * Accent — reserved for precise moments of emphasis (CTAs, highlights, AI cues).
 * Use sparingly; do not let it overpower the core palette.
 */
export const accentColors = {
  /** FARI Purple. RGB 129, 97, 204. */
  purple: '#8161CC',
} as const

/**
 * Supporting colors — status indication in demos/dashboards ONLY.
 * Per brand guidelines these must never appear in official documents
 * (business cards, flyers, certificates, etc.).
 */
export const statusColors = {
  /** OK / healthy. RGB 29, 165, 135. */
  ok: '#1DA587',
  /** Gathering / in-progress. RGB 67, 183, 222. */
  gathering: '#43B7DE',
  /** Not OK / error. RGB 179, 42, 45. */
  notOk: '#B32A2D',
} as const

export type BrandColor = keyof typeof brandColors
export type NeutralColor = keyof typeof neutralColors
export type AccentColor = keyof typeof accentColors
export type StatusColor = keyof typeof statusColors
