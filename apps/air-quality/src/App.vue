<script setup lang="ts">
import HeaderBar from './components/HeaderBar.vue'
import MapView from './components/MapView.vue'
import Controls from './components/Controls.vue'
import Legend from './components/Legend.vue'
import DetailPanel from './components/DetailPanel.vue'
</script>

<template>
  <div class="shell">
    <MapView />
    <HeaderBar />

    <div class="rail">
      <div class="panel">
        <Controls />
        <hr class="rule" />
        <Legend />
      </div>
      <DetailPanel />
    </div>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.rail {
  position: absolute;
  top: 4rem;
  left: 1rem;
  bottom: 1rem;
  z-index: 9;
  width: 19rem;
  max-width: calc(100vw - 2rem);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}
.panel {
  pointer-events: auto;
  background: var(--aq-panel);
  backdrop-filter: blur(10px);
  border: 1px solid var(--aq-line);
  border-radius: 0.9rem;
  box-shadow: var(--aq-shadow);
  padding: 1rem;
}
.detail-panel:empty {
  display: none;
}
.rule {
  border: 0;
  border-top: 1px solid var(--aq-line);
  margin: 0.9rem 0;
}
@media (max-width: 720px) {
  .rail {
    width: auto;
    right: 1rem;
  }
}
</style>
