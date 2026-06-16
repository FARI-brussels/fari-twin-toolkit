import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import '@fari-brussels/twin-ui-tokens/css'; // --fari-* brand custom properties (source of truth)
import '@fari-brussels/twin-ui-vue/style.css'; // FARI component styles (FSegmented, …)
import './style.css';
import App from './App.vue';
import router from './router';
import { vueKeycloak } from '@josempgon/vue-keycloak';
import { createPinia } from "pinia";

// Keycloak configuration from environment variables
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM;
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

const pinia = createPinia();
const app = createApp(App);

app
  .use(router)
  .use(pinia)
  .use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60, // 1 minute
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    },
  });

// Keycloak is optional. With no VITE_KEYCLOAK_URL the app runs unauthenticated
// (public content only) — matching the documented .env default — and useKeycloak()
// safely reports a signed-out state. When configured, we run a *silent* check-sso:
// the SSO probe happens in a hidden iframe (silent-check-sso.html) instead of a
// full-page redirect, so a dev origin that isn't yet whitelisted in the Keycloak
// client can't replace the app with Keycloak's "Invalid redirect_uri" error page.

// Auth is gated on env: with no VITE_KEYCLOAK_URL the app runs unauthenticated
// (and useAuth() safely reports a signed-out state). To run locally without auth
// — and without the "no refresh token" console noise — comment out VITE_KEYCLOAK_URL
// in .env rather than this block.
if (keycloakUrl && keycloakRealm && keycloakClientId) {
  app.use(vueKeycloak, {
    config: {
      url: keycloakUrl,
      realm: keycloakRealm,
      clientId: keycloakClientId,
    },
    initOptions: {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      flow: 'standard',
      responseMode: 'fragment',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      enableLogging: false, // Disable verbose Keycloak logging
      messageReceiveTimeout: 10000,
    },
  });
}

app.mount('#app');
