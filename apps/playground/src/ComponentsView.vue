<script setup lang="ts">
import { ref } from 'vue'
import {
  FButton,
  FSwitch,
  FSlider,
  FYearSlider,
  FChoroplethLegend,
} from '@fari-brussels/twin-ui-vue'
import {
  IconSearch,
  IconSettings,
  IconNotification,
  IconUser,
  IconWarning,
  IconError,
  IconInfo,
  IconSun,
  IconCloud,
} from '@fari-brussels/twin-ui-icons'

const notify = ref(true)
const opacity = ref(60)
const year = ref(2024)
const loading = ref(false)

const trigger = () => {
  loading.value = true
  setTimeout(() => (loading.value = false), 1200)
}
</script>

<template>
  <div class="cv">
    <section>
      <h2>Buttons</h2>
      <div class="row">
        <FButton variant="primary" @click="trigger"> <IconSearch :size="16" /> Primary </FButton>
        <FButton variant="secondary">Secondary</FButton>
        <FButton variant="ghost">Ghost</FButton>
        <FButton variant="primary" size="sm">Small</FButton>
        <FButton variant="primary" size="lg">Large</FButton>
        <FButton variant="primary" disabled>Disabled</FButton>
        <FButton variant="primary" :loading="loading">Click me</FButton>
      </div>
    </section>

    <section>
      <h2>Switch &amp; Slider</h2>
      <div class="row">
        <FSwitch v-model="notify" label="Notifications" />
        <span class="muted">opacity {{ opacity }}%</span>
        <FSlider v-model="opacity" :min="0" :max="100" aria-label="Opacity" style="width: 16rem" />
      </div>
    </section>

    <section>
      <h2>Year slider (domain widget)</h2>
      <FYearSlider v-model="year" :min-year="2000" :max-year="2025" label="Year" />
    </section>

    <section>
      <h2>Choropleth legend</h2>
      <FChoroplethLegend
        title="Unemployment"
        unit="%"
        :stops="[
          { value: 5, color: '#64D8BF' },
          { value: 20, color: '#B32A2D' },
        ]"
        style="max-width: 22rem"
      />
    </section>

    <section>
      <h2>Icons (color themes with CSS)</h2>
      <div class="row icons">
        <IconSearch />
        <IconSettings />
        <IconNotification />
        <IconUser />
        <IconWarning style="color: var(--fari-status-gathering)" />
        <IconError style="color: var(--fari-status-not-ok)" />
        <IconInfo style="color: var(--fari-web-blue)" />
        <IconSun style="color: var(--fari-lighthouse)" />
        <IconCloud style="color: var(--fari-blue)" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.cv {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
h2 {
  margin: 0 0 0.75rem;
  font-size: var(--fari-font-size-h2);
  color: var(--fari-web-blue);
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.icons {
  color: var(--fari-blue);
  font-size: 1.5rem;
}
.muted {
  font-size: var(--fari-font-size-body-sm);
  color: var(--fari-black);
  opacity: 0.65;
  min-width: 7ch;
}
</style>
