import { ref } from 'vue'

// Module-level singleton: any component can open/close the shared login dialog
// without prop-drilling or an event bus.
const isOpen = ref(false)

/** Shared open/close state for an app-wide login dialog. */
export function useLoginDialog() {
  return {
    isOpen,
    open: () => {
      isOpen.value = true
    },
    close: () => {
      isOpen.value = false
    },
  }
}
