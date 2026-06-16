import type { Config } from 'tailwindcss'
import { brandColors, neutralColors, accentColors, statusColors } from './colors'
import { mainGradients, accentGradients, toCssLinearGradient } from './gradients'
import { fontFamilies, fontSizes } from './typography'

/**
 * Tailwind preset exposing FARI tokens. Consume from a project's
 * `tailwind.config.ts`:
 *
 *   import fariPreset from '@fari-brussels/twin-ui-tokens/tailwind'
 *   export default { presets: [fariPreset], content: [...] }
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        'fari-blue': brandColors.blue,
        'fari-web-blue': brandColors.webBlue,
        'fari-lighthouse': brandColors.lighthouseBlue,
        'fari-black': neutralColors.black,
        'fari-white': neutralColors.white,
        'fari-purple': accentColors.purple,
        // status — demos/dashboards only
        'fari-ok': statusColors.ok,
        'fari-gathering': statusColors.gathering,
        'fari-not-ok': statusColors.notOk,
      },
      fontFamily: {
        sans: [fontFamilies.primary],
        primary: [fontFamilies.primary],
        secondary: [fontFamilies.secondary],
        display: [fontFamilies.display],
      },
      fontSize: {
        'fari-display': fontSizes.display.rem,
        'fari-h1': fontSizes.h1.rem,
        'fari-h2': fontSizes.h2.rem,
        'fari-body': fontSizes.body.rem,
        'fari-body-sm': fontSizes.bodySm.rem,
        'fari-caption': fontSizes.caption.rem,
        'fari-micro': fontSizes.micro.rem,
      },
      backgroundImage: {
        'fari-gradient-1': toCssLinearGradient(mainGradients.g1),
        'fari-gradient-2': toCssLinearGradient(mainGradients.g2),
        'fari-gradient-3': toCssLinearGradient(mainGradients.g3),
        'fari-gradient-4': toCssLinearGradient(mainGradients.g4),
        'fari-accent-gradient-1': toCssLinearGradient(accentGradients.g1),
        'fari-accent-gradient-2': toCssLinearGradient(accentGradients.g2),
      },
    },
  },
}

export default preset
