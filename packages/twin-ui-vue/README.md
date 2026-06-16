# @fari-brussels/twin-ui-vue

The FARI Vue 3 component library — modern SFCs built on `@fari-brussels/twin-ui-tokens`
(colors, typography) and `@fari-brussels/twin-ui-icons` (the canonical icon set). Vite
library build with proper `.d.ts` (vue-tsc). `vue` is a peer dependency.

> v0.1 ships the core primitives + first domain widgets. The style is a sensible
> default, made to be adapted — every component themes via the `--fari-*` CSS
> variables.

## Install

```bash
pnpm add @fari-brussels/twin-ui-vue @fari-brussels/twin-ui-tokens
```

In your app entry, once:

```ts
import '@fari-brussels/twin-ui-tokens/css' // --fari-* custom properties
import '@fari-brussels/twin-ui-vue/style.css' // component styles
```

## Components

### Primitives

- **`FButton`** — `variant` (`primary` | `secondary` | `ghost`), `size`
  (`sm` | `md` | `lg`), `disabled`, `loading`, `block`, `type`. Slot content.
  Native click falls through.
- **`FSwitch`** — accessible on/off toggle (role="switch"). `v-model: boolean`,
  optional `label`.
- **`FSlider`** — numeric range. `v-model: number`, `min`/`max`/`step`,
  `aria-label`.

### Domain widgets

- **`FYearSlider`** — composes `FSlider` for the BrusselsMigration-style year
  picker. `v-model: number`, `min-year` / `max-year`.
- **`FChoroplethLegend`** — gradient legend for `colorBy` ramps; pass the same
  `stops` you give to `viewer-core`'s `StyleSpec`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FButton, FYearSlider, FChoroplethLegend } from '@fari-brussels/twin-ui-vue'
import { IconSearch } from '@fari-brussels/twin-ui-icons'

const year = ref(2024)
</script>

<template>
  <FButton variant="primary"><IconSearch :size="16" /> Search</FButton>
  <FYearSlider v-model="year" :min-year="2000" :max-year="2025" />
  <FChoroplethLegend
    title="Unemployment"
    unit="%"
    :stops="[
      { value: 5, color: '#64D8BF' },
      { value: 20, color: '#B32A2D' },
    ]"
  />
</template>
```

## Theming

All components use `var(--fari-*)` with safe fallbacks. To restyle a project,
override the variables in your own CSS (or change the tokens package). For
deeper changes the SFCs are deliberately simple — copy/adapt as needed.

## Test

```bash
pnpm --filter @fari-brussels/twin-ui-vue test
```

Vitest + jsdom + `@vue/test-utils` cover render, v-model, accessibility roles,
and the gradient math.
