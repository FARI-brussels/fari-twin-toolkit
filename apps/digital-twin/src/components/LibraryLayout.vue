<script setup lang="ts">
// Library layout — navigation handled by Header; nested view cross-fades.
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden">
      <RouterView />
    </div>
  </div>
</template>
