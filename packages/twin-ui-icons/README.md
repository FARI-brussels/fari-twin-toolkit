# @fari-brussels/twin-ui-icons

The **canonical FARI icon set** (59 icons) as tree-shakeable Vue 3 components,
generated from the designers' source SVGs in `./svg`. These are the preferred
FARI icons — use them before any third-party set.

Every icon is monochrome and rendered with `currentColor`, so it inherits the
surrounding text color (style it with CSS `color` / brand tokens). `vue` is a
peer dependency.

## Usage

Named imports (tree-shakeable — ship only what you use):

```vue
<script setup lang="ts">
import { IconSearch, IconUserBlack } from '@fari-brussels/twin-ui-icons'
</script>

<template>
  <IconSearch :size="20" style="color: var(--fari-blue)" />
  <IconUserBlack :size="24" title="Account" />
</template>
```

Dynamic by name (convenient; pulls the whole set):

```vue
<script setup lang="ts">
import { FariIcon, type IconName } from '@fari-brussels/twin-ui-icons'
const icon: IconName = 'settings'
</script>

<template>
  <FariIcon :name="icon" :size="20" />
</template>
```

Props: `size` (number/CSS length, default 24), `title` (sets `role="img"` +
`aria-label`; otherwise the icon is `aria-hidden`). Any other attribute (class,
style, @click) is forwarded to the `<svg>`.

## Naming

Each source file `FARI_Icon_<Name>[_Black].svg` becomes:

- a component `Icon<Name>` / `Icon<Name>Black` (e.g. `IconUp`, `IconUpBlack`)
- a registry slug `<name>` / `<name>-black` (e.g. `'up'`, `'up-black'`)

Categories: navigation, interface, content, user & system, feedback, demo
(weather/illustration). The two variants per UI icon are the line (`default`)
and solid (`Black`) styles.

## Regenerate

The components are generated and committed; re-run when the SVGs change:

```bash
pnpm --filter @fari-brussels/twin-ui-icons generate
```

Do not edit `src/generated/*` by hand.
