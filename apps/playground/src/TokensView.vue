<script setup lang="ts">
import { tokens, toCssLinearGradient } from '@fari-brussels/twin-ui-tokens'

const colorGroups = [
  { title: 'Primary', colors: tokens.brandColors },
  { title: 'Neutral', colors: tokens.neutralColors },
  { title: 'Accent (sparing use)', colors: tokens.accentColors },
  { title: 'Status (demos only)', colors: tokens.statusColors },
]

const gradients = [
  ...Object.entries(tokens.mainGradients).map(([k, g]) => ({
    name: `gradient-${k.replace(/^g/, '')}`,
    css: toCssLinearGradient(g),
  })),
  ...Object.entries(tokens.accentGradients).map(([k, g]) => ({
    name: `accent-gradient-${k.replace(/^g/, '')}`,
    css: toCssLinearGradient(g),
  })),
]

const typeScale = Object.entries(tokens.fontSizes).map(([k, s]) => ({
  name: k,
  rem: s.rem,
  px: s.px,
}))
</script>

<template>
  <div>
    <section v-for="group in colorGroups" :key="group.title">
      <h2>{{ group.title }}</h2>
      <div class="grid">
        <figure v-for="(hex, name) in group.colors" :key="name">
          <div class="swatch" :style="{ background: hex }" />
          <figcaption>
            <strong>{{ name }}</strong>
            <span>{{ hex }}</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <section>
      <h2>Gradients</h2>
      <div class="grid">
        <figure v-for="g in gradients" :key="g.name">
          <div class="swatch" :style="{ backgroundImage: g.css }" />
          <figcaption>
            <strong>{{ g.name }}</strong>
          </figcaption>
        </figure>
      </div>
    </section>

    <section>
      <h2>Type scale</h2>
      <div class="type-list">
        <div v-for="t in typeScale" :key="t.name" :style="{ fontSize: t.rem }">
          {{ t.name }} — We put the Common Good at the heart of AI
          <span class="meta">{{ t.rem }} / {{ t.px }}px</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
h2 {
  margin: 2.5rem 0 1rem;
  font-size: var(--fari-font-size-h2);
  color: var(--fari-web-blue);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 1rem;
}
figure {
  margin: 0;
  border: 1px solid #eee;
  border-radius: 0.5rem;
  overflow: hidden;
}
.swatch {
  height: 5rem;
}
figcaption {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.65rem;
  font-size: var(--fari-font-size-caption);
}
figcaption span {
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
.type-list > div {
  padding: 0.4rem 0;
  border-bottom: 1px dashed #eee;
}
.type-list .meta {
  font-size: 0.8rem;
  color: var(--fari-web-blue);
  opacity: 0.7;
  margin-left: 0.5rem;
}
</style>
