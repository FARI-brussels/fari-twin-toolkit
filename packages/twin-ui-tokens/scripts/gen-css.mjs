// Generates dist/fari-tokens.css from the built token modules.
// Run after `tsup` (which produces dist/index.js). TS is the single source of
// truth; this script only projects it to CSS custom properties.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tokens, toCssLinearGradient } from '../dist/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../dist/fari-tokens.css')

const lines = [':root {']

const push = (name, value) => lines.push(`  --fari-${name}: ${value};`)
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

// Colors
push('blue', tokens.brandColors.blue)
push('web-blue', tokens.brandColors.webBlue)
push('lighthouse', tokens.brandColors.lighthouseBlue)
push('black', tokens.neutralColors.black)
push('white', tokens.neutralColors.white)
push('purple', tokens.accentColors.purple)
push('status-ok', tokens.statusColors.ok)
push('status-gathering', tokens.statusColors.gathering)
push('status-not-ok', tokens.statusColors.notOk)

// Gradients — strip the leading "g" so keys map to --fari-gradient-1 etc.,
// matching the Tailwind preset's `bg-fari-gradient-1` class names.
for (const [key, stops] of Object.entries(tokens.mainGradients)) {
  push(`gradient-${key.replace(/^g/, '')}`, toCssLinearGradient(stops))
}
for (const [key, stops] of Object.entries(tokens.accentGradients)) {
  push(`accent-gradient-${key.replace(/^g/, '')}`, toCssLinearGradient(stops))
}

// Typography
push('font-primary', tokens.fontFamilies.primary)
push('font-secondary', tokens.fontFamilies.secondary)
push('font-display', tokens.fontFamilies.display)
for (const [key, step] of Object.entries(tokens.fontSizes)) {
  push(`font-size-${kebab(key)}`, step.rem)
}
for (const [key, weight] of Object.entries(tokens.fontWeights)) {
  push(`font-weight-${key}`, String(weight))
}

lines.push('}')
writeFileSync(out, lines.join('\n') + '\n')
console.log(`wrote ${out}`)
