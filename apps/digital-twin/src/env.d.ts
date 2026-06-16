/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_KEYCLOAK_REDIRECT_PATH?: string;
  readonly VITE_KEYCLOAK_LOGOUT_REDIRECT_PATH?: string;
  readonly VITE_KEYCLOAK_SILENT_CHECK_PATH?: string;
  readonly VITE_TWIN_API_TOKEN?: string;
  readonly VITE_CESIUM_ION_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
