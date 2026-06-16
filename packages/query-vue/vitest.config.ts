import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Thin TanStack wrapper — exercising it needs a full QueryClient + component
    // harness; the contract is covered by typecheck/build. Behaviour is verified
    // through the consuming app.
    passWithNoTests: true,
  },
})
