# @fari-brussels/twin-ui-tokens

FARI brand design tokens — the single source of truth for colors, gradients and
typography across the Twin Toolkit. Values come from the FARI Brand Book.

TypeScript is the source of truth (`src/`). The CSS custom properties and the
Tailwind preset are projected from it at build time, so they never drift.

## Install

```bash
pnpm add @fari-brussels/twin-ui-tokens
```

## Usage

### TypeScript

```ts
import {
  tokens,
  brandColors,
  toCssLinearGradient,
  mainGradients,
} from '@fari-brussels/twin-ui-tokens'

brandColors.blue // '#183E91'
toCssLinearGradient(mainGradients.g1) // 'linear-gradient(90deg, #00DCBE 0%, ...)'
```

### CSS custom properties

```ts
import '@fari-brussels/twin-ui-tokens/css'
```

```css
.button {
  background: var(--fari-blue);
  color: var(--fari-white);
  font-family: var(--fari-font-primary);
  font-size: var(--fari-font-size-h2);
}
.hero {
  background-image: var(--fari-gradient-1);
}
```

### Tailwind preset

```ts
// tailwind.config.ts
import fariPreset from '@fari-brussels/twin-ui-tokens/tailwind'
export default {
  presets: [fariPreset],
  content: ['./src/**/*.{vue,ts,tsx}'],
}
```

```html
<div class="bg-fari-blue text-fari-white font-primary text-fari-h1">…</div>
<div class="bg-fari-gradient-1">…</div>
```

## Tokens

| Group               | Tokens                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| Primary             | `blue` `#183E91`, `webBlue` `#2E4FBF`, `lighthouseBlue` `#64D8BF`            |
| Neutral             | `black` `#181716`, `white` `#FFFFFF`                                         |
| Accent              | `purple` `#8161CC` (sparing use)                                             |
| Status (demos only) | `ok` `#1DA587`, `gathering` `#43B7DE`, `notOk` `#B32A2D`                     |
| Main gradients      | `g1`–`g4`                                                                    |
| Accent gradients    | `g1`–`g2` (sparing use)                                                      |
| Fonts               | `primary` Montserrat, `secondary` Open Sans (docs), `display` Amsterdam Four |
| Type scale          | `display` `h1` `h2` `body` `bodySm` `caption` `micro` (ratio 1.2)            |

## Brand rules baked in

- **Status colors are for demos/dashboards only** — never in official documents.
- **Purple accent + accent gradients are for sparing emphasis** only.
- **Pairing:** brand colors standalone or as a background with white type; avoid
  combining two brand colors as text + background.

## Build

```bash
pnpm build   # tsup -> dist/*.js + .d.ts, then gen-css.mjs -> dist/fari-tokens.css
```

## Not here yet

- Iconography (`@fari-brussels/twin-ui-icons`) — the brand defines icon sets
  (navigation, interface, content, user & system, feedback) but the SVGs live in
  the Figma kit, not this package yet.
- Spacing / radius / elevation scales — to be added once the component library
  needs them.
