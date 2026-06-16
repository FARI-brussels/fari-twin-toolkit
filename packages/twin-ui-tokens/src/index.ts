export * from './colors'
export * from './gradients'
export * from './typography'

import { brandColors, neutralColors, accentColors, statusColors } from './colors'
import { mainGradients, accentGradients } from './gradients'
import { fontFamilies, fontSizes, fontWeights } from './typography'

/** All FARI design tokens in one object. */
export const tokens = {
  brandColors,
  neutralColors,
  accentColors,
  statusColors,
  mainGradients,
  accentGradients,
  fontFamilies,
  fontSizes,
  fontWeights,
} as const

export type Tokens = typeof tokens
