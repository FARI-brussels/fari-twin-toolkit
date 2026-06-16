<script setup lang="ts">
import HeaderBar from './components/HeaderBar.vue'
import MapView from './components/MapView.vue'
import Sidebar from './components/Sidebar.vue'
import WhatIfPanel from './components/WhatIfPanel.vue'
</script>

<template>
  <div class="shell">
    <HeaderBar />
    <main class="grid">
      <Sidebar class="col-side" />
      <div class="col-map">
        <MapView />
      </div>
    </main>
    <WhatIfPanel />
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}
.grid {
  display: grid;
  grid-template-columns: 22rem 1fr;
  min-height: 0;
}
.col-side {
  height: 100%;
  min-height: 0;
}
.col-map {
  min-height: 0;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
