/**
 * FARI typography tokens. Source: FARI Brand Book, section 04 (Typography).
 *
 * - Montserrat: primary typeface — branding, titles, headings, body, UI.
 * - Open Sans: reserved for long-form documents produced by FARI; not for
 *   official brand communications outside that context.
 * - Amsterdam Four: display typeface for certificates / select deliverables.
 *   Use sparingly.
 */
export const fontFamilies = {
  primary: "'Montserrat', system-ui, -apple-system, sans-serif",
  secondary: "'Open Sans', system-ui, -apple-system, sans-serif",
  display: "'Amsterdam Four', 'Montserrat', sans-serif",
} as const

/**
 * Modular type scale — ratio 1.2 (minor third). The brand book expresses the
 * scale against a 20px design base (so `1rem` = 20px in their reference). We
 * keep the rem values verbatim and also expose the reference px for tooling.
 */
export interface TypeStep {
  rem: string
  /** Reference pixel size at the brand's 20px design base. */
  px: number
}

export const fontSizes = {
  /** 41.47px — large display / hero. */
  display: { rem: '2.074rem', px: 41.47 },
  /** 28.80px — h1. */
  h1: { rem: '1.44rem', px: 28.8 },
  /** 24.00px — h2. */
  h2: { rem: '1.2rem', px: 24.0 },
  /** 20.00px — body (base). */
  body: { rem: '1rem', px: 20.0 },
  /** 16.67px — small body / secondary text. */
  bodySm: { rem: '0.833rem', px: 16.67 },
  /** 13.89px — caption / labels. */
  caption: { rem: '0.694rem', px: 13.89 },
  /** 11.57px — micro / fine print. */
  micro: { rem: '0.579rem', px: 11.57 },
} as const satisfies Record<string, TypeStep>

/** Montserrat ships these weights; align UI usage to them. */
export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const

export type FontFamily = keyof typeof fontFamilies
export type FontSize = keyof typeof fontSizes
export type FontWeight = keyof typeof fontWeights
