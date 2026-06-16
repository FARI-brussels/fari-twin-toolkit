<script setup lang="ts"></script>

<template>
  <header class="bar">
    <div class="logo">
      Brussels<span class="accent">PolicyTwin</span>
      <span class="sub">v2 · FARI Twin Toolkit demo</span>
    </div>
    <div class="badge">DEMO</div>
  </header>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.25rem;
  height: 3.25rem;
  background: var(--fari-blue);
  color: var(--fari-white);
  border-bottom: 2px solid var(--fari-lighthouse);
}
.logo {
  font-size: var(--fari-font-size-h2);
  font-weight: var(--fari-font-weight-extrabold);
  letter-spacing: 0.02em;
}
.accent {
  color: var(--fari-lighthouse);
}
.sub {
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-regular);
  margin-left: 0.6rem;
  opacity: 0.8;
}
.badge {
  margin-left: auto;
  background: var(--fari-lighthouse);
  color: var(--fari-blue);
  font-size: var(--fari-font-size-caption);
  font-weight: var(--fari-font-weight-bold);
  letter-spacing: 0.16em;
  padding: 0.25rem 0.6rem;
  border-radius: 2rem;
}
</style>
