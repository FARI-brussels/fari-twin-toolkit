<script setup lang="ts"></script>

<template>
  <header class="bar">
    <div class="logo">
      Brussels<span class="accent"> AirQuality</span>
      <span class="sub">FARI Twin Toolkit · MapLibre renderer</span>
    </div>
    <a class="badge" href="https://fari.brussels" target="_blank" rel="noreferrer">DEMO</a>
  </header>
</template>

<style scoped>
.bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 3.25rem;
  padding: 0 1.1rem;
  color: var(--fari-white);
  background: linear-gradient(180deg, rgba(10, 18, 48, 0.78) 0%, rgba(10, 18, 48, 0) 100%);
  pointer-events: none;
}
.logo {
  font-size: var(--fari-font-size-h2);
  font-weight: var(--fari-font-weight-extrabold);
  letter-spacing: 0.01em;
  text-shadow: 0 1px 8px rgba(10, 18, 48, 0.4);
}
.accent {
  color: var(--fari-lighthouse);
}
.sub {
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-regular);
  margin-left: 0.6rem;
  opacity: 0.85;
}
.badge {
  margin-left: auto;
  pointer-events: auto;
  text-decoration: none;
  background: var(--fari-lighthouse);
  color: var(--fari-blue);
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-bold);
  letter-spacing: 0.16em;
  padding: 0.25rem 0.6rem;
  border-radius: 2rem;
}
</style>
