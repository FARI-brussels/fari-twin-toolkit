/**
 * App-local `useAuth` — a thin wrapper over the toolkit's `@fari-brussels/auth-vue`
 * composable that injects this app's Keycloak redirect path from env. Keeping
 * the env read here (rather than in the shared package) leaves app-specific
 * config in the app. All consuming components import this unchanged.
 */
import { useAuth as useAuthBase } from '@fari-brussels/auth-vue';

export function useAuth() {
  return useAuthBase({
    redirectPath: import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback',
  });
}
